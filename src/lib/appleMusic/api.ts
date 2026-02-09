/**
 * Apple Music API Client
 * Replaces MusicBrainz, Last.fm, Wikidata, and ListenBrainz
 */

import { getAppleMusicHeaders, APPLE_MUSIC_BASE_URL } from "./auth";
import { searchCache, artistCache, albumCache } from "@/lib/cache";

const STOREFRONT = process.env.APPLE_MUSIC_STOREFRONT || "us";

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Replace {w}x{h} in Apple Music artwork URL with actual dimensions
 */
export function artworkUrl(
  urlTemplate: string | undefined,
  width: number = 300,
  height?: number,
): string {
  if (!urlTemplate) return "";
  return urlTemplate
    .replace("{w}", String(width))
    .replace("{h}", String(height ?? width));
}

async function appleMusicFetch<T>(
  path: string,
  retries: number = 2,
): Promise<T | null> {
  const headers = await getAppleMusicHeaders();
  if (!headers) {
    console.error("Apple Music: failed to get auth headers");
    return null;
  }

  const url = `${APPLE_MUSIC_BASE_URL}${path}`;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, {
        headers,
        next: { revalidate: 3600 },
      });

      if (res.status === 429) {
        // Rate limited — wait and retry
        const retryAfter = Number(res.headers.get("Retry-After")) || 1;
        const delay = Math.min(retryAfter * 1000, 5000) * (attempt + 1);
        if (attempt < retries) {
          await new Promise((r) => setTimeout(r, delay));
          continue;
        }
        console.error(`Apple Music API 429 (exhausted retries) for ${path}`);
        return null;
      }

      if (!res.ok) {
        const body = await res.text();
        console.error(
          `Apple Music API ${res.status} for ${path}:`,
          body.substring(0, 500),
        );
        return null;
      }

      return res.json();
    } catch (err) {
      if (attempt < retries) {
        await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)));
        continue;
      }
      console.error("Apple Music fetch error for", url, ":", err);
      return null;
    }
  }

  return null;
}

// ─── Search ───────────────────────────────────────────────────────────────────

export interface AppleSearchResult {
  artists: AppleArtistResult[];
  albums: AppleAlbumResult[];
  songs: AppleSongResult[];
}

export interface AppleArtistResult {
  id: string;
  name: string;
  genres: string[];
  artworkUrl?: string;
  url?: string;
}

export interface AppleAlbumResult {
  id: string;
  name: string;
  artistName: string;
  artistId?: string;
  artworkUrl?: string;
  releaseDate?: string;
  trackCount?: number;
  contentRating?: string;
  isSingle?: boolean;
  isCompilation?: boolean;
  isComplete?: boolean;
  genreNames?: string[];
  url?: string;
}

export interface AppleSongResult {
  id: string;
  name: string;
  artistName: string;
  artistId?: string;
  albumName?: string;
  albumId?: string;
  artworkUrl?: string;
  releaseDate?: string;
  durationMs?: number;
  trackNumber?: number;
  discNumber?: number;
  genreNames?: string[];
  url?: string;
}

function parseArtist(item: any): AppleArtistResult {
  const a = item.attributes || {};
  return {
    id: item.id,
    name: a.name || "",
    genres: a.genreNames || [],
    artworkUrl: a.artwork?.url,
    url: a.url,
  };
}

function parseAlbum(item: any): AppleAlbumResult {
  const a = item.attributes || {};
  const artistRel = item.relationships?.artists?.data?.[0];
  return {
    id: item.id,
    name: a.name || "",
    artistName: a.artistName || "",
    artistId: artistRel?.id,
    artworkUrl: a.artwork?.url,
    releaseDate: a.releaseDate,
    trackCount: a.trackCount,
    contentRating: a.contentRating,
    isSingle: a.isSingle === true,
    isCompilation: a.isCompilation === true,
    isComplete: a.isComplete === true,
    genreNames: a.genreNames || [],
    url: a.url,
  };
}

function extractAlbumIdFromUrl(url?: string): string | undefined {
  if (!url) return undefined;
  // Apple Music song URLs: https://music.apple.com/us/album/song-name/ALBUM_ID?i=SONG_ID
  const match = url.match(/\/album\/[^/]+\/(\d+)/);
  return match?.[1];
}

function parseSong(item: any): AppleSongResult {
  const a = item.attributes || {};
  const albumRel = item.relationships?.albums?.data?.[0];
  const artistRel = item.relationships?.artists?.data?.[0];
  return {
    id: item.id,
    name: a.name || "",
    artistName: a.artistName || "",
    artistId: artistRel?.id,
    albumName: a.albumName,
    albumId: albumRel?.id || extractAlbumIdFromUrl(a.url),
    artworkUrl: a.artwork?.url,
    releaseDate: a.releaseDate,
    durationMs: a.durationInMillis,
    trackNumber: a.trackNumber,
    discNumber: a.discNumber,
    genreNames: a.genreNames || [],
    url: a.url,
  };
}

/**
 * Search Apple Music for artists, albums, and songs
 */
export async function searchAppleMusic(
  query: string,
  types: ("artists" | "albums" | "songs")[] = ["artists", "albums", "songs"],
  limit: number = 10,
): Promise<AppleSearchResult> {
  const cacheKey = `am-search:${query}:${types.join(",")}:${limit}`;
  const cached = searchCache.get(cacheKey);
  if (cached) return cached as AppleSearchResult;

  const typesParam = types.join(",");
  const path = `/catalog/${STOREFRONT}/search?term=${encodeURIComponent(query)}&types=${typesParam}&limit=${limit}`;

  const data = await appleMusicFetch<any>(path);

  const result: AppleSearchResult = {
    artists: (data?.results?.artists?.data || []).map(parseArtist),
    albums: (data?.results?.albums?.data || []).map(parseAlbum),
    songs: (data?.results?.songs?.data || []).map(parseSong),
  };

  if (
    result.artists.length > 0 ||
    result.albums.length > 0 ||
    result.songs.length > 0
  ) {
    searchCache.set(cacheKey, result, 1800);
  }

  return result;
}

// ─── Artist ───────────────────────────────────────────────────────────────────

export interface AppleArtistDetail {
  id: string;
  name: string;
  genres: string[];
  artworkUrl?: string;
  url?: string;
  editorialNotes?: string;
}

/**
 * Get artist details by Apple Music ID
 */
export async function getArtist(
  artistId: string,
): Promise<AppleArtistDetail | null> {
  const cacheKey = `am-artist:${artistId}`;
  const cached = artistCache.get(cacheKey);
  if (cached) return cached as AppleArtistDetail;

  const data = await appleMusicFetch<any>(
    `/catalog/${STOREFRONT}/artists/${artistId}`,
  );

  const item = data?.data?.[0];
  if (!item) return null;

  const a = item.attributes || {};
  const result: AppleArtistDetail = {
    id: item.id,
    name: a.name || "",
    genres: a.genreNames || [],
    artworkUrl: a.artwork?.url,
    url: a.url,
    editorialNotes:
      a.editorialNotes?.standard || a.editorialNotes?.short || undefined,
  };

  artistCache.set(cacheKey, result, 86400);
  return result;
}

/**
 * All artist discography data returned from a single API call
 */
export interface ArtistDiscography {
  artist: AppleArtistDetail;
  topSongs: AppleTopSong[];
  featuredAlbums: AppleArtistAlbum[];
  fullAlbums: AppleArtistAlbum[];
  singles: AppleArtistAlbum[];
  compilations: AppleArtistAlbum[];
  appearsOn: AppleArtistAlbum[];
}

/**
 * Fetch artist + all views in a single API call using ?views= parameter.
 * This matches the data shown on music.apple.com artist pages.
 */
export async function getArtistWithViews(
  artistId: string,
): Promise<ArtistDiscography | null> {
  const cacheKey = `am-artist-full:${artistId}`;
  const cached = artistCache.get(cacheKey);
  if (cached) return cached as ArtistDiscography;

  const data = await appleMusicFetch<any>(
    `/catalog/${STOREFRONT}/artists/${artistId}?views=top-songs,featured-albums,full-albums,singles,compilation-albums,appears-on-albums&include[songs]=albums`,
  );

  const item = data?.data?.[0];
  if (!item) return null;

  const a = item.attributes || {};
  const views = item.views || {};

  const artist: AppleArtistDetail = {
    id: item.id,
    name: a.name || "",
    genres: a.genreNames || [],
    artworkUrl: a.artwork?.url,
    url: a.url,
    editorialNotes:
      a.editorialNotes?.standard || a.editorialNotes?.short || undefined,
  };

  // Parse top songs from the view
  const topSongsData = views["top-songs"]?.data || [];
  const topSongs: AppleTopSong[] = topSongsData.map((s: any) => {
    const sa = s.attributes || {};
    const songAlbumRel = s.relationships?.albums?.data?.[0];
    return {
      id: s.id,
      name: sa.name || "",
      artistName: sa.artistName || "",
      artistId: artistId,
      albumName: sa.albumName,
      albumId: songAlbumRel?.id,
      artworkUrl: sa.artwork?.url,
      releaseDate: sa.releaseDate,
      durationMs: sa.durationInMillis,
      trackNumber: sa.trackNumber,
      url: sa.url,
    };
  });

  const result: ArtistDiscography = {
    artist,
    topSongs,
    featuredAlbums: sortByDateDesc(
      parseAlbumItems(views["featured-albums"]?.data || []),
    ),
    fullAlbums: sortByDateDesc(
      parseAlbumItems(views["full-albums"]?.data || []),
    ),
    singles: sortByDateDesc(parseAlbumItems(views["singles"]?.data || [])),
    compilations: sortByDateDesc(
      parseAlbumItems(views["compilation-albums"]?.data || []),
    ),
    appearsOn: sortByDateDesc(
      parseAlbumItems(views["appears-on-albums"]?.data || []),
    ),
  };

  artistCache.set(cacheKey, result, 86400);
  return result;
}

// ─── Artist Albums (Discography) ──────────────────────────────────────────────

export interface AppleArtistAlbum {
  id: string;
  name: string;
  artistName: string;
  artworkUrl?: string;
  releaseDate?: string;
  trackCount?: number;
  isSingle: boolean;
  isCompilation: boolean;
  genreNames?: string[];
  contentRating?: string;
  url?: string;
}

/**
 * Classify an album into: "Album" | "EP" | "Single" | "Compilation"
 */
export function classifyAlbumType(album: {
  name: string;
  isSingle: boolean;
  isCompilation: boolean;
  trackCount?: number;
}): string {
  if (album.isCompilation) return "Compilation";
  if (album.isSingle) {
    const lower = album.name.toLowerCase();
    if (
      lower.includes(" ep") ||
      lower.includes("(ep)") ||
      lower.endsWith(" - ep")
    ) {
      return "EP";
    }
    return "Single";
  }
  return "Album";
}

/**
 * Parse raw Apple Music album items into AppleArtistAlbum[]
 */
function parseAlbumItems(items: any[]): AppleArtistAlbum[] {
  return items.map((item: any) => {
    const a = item.attributes || {};
    return {
      id: item.id,
      name: a.name || "",
      artistName: a.artistName || "",
      artworkUrl: a.artwork?.url,
      releaseDate: a.releaseDate,
      trackCount: a.trackCount,
      isSingle: a.isSingle === true,
      isCompilation: a.isCompilation === true,
      genreNames: a.genreNames || [],
      contentRating: a.contentRating,
      url: a.url,
    };
  });
}

/**
 * Sort albums by release date descending
 */
function sortByDateDesc(albums: AppleArtistAlbum[]): AppleArtistAlbum[] {
  return albums.sort((a, b) =>
    (b.releaseDate || "").localeCompare(a.releaseDate || ""),
  );
}

/**
 * Fetch a paginated artist view endpoint (full-albums, singles, etc.)
 * These view endpoints return the same curated data as music.apple.com
 */
async function fetchArtistView(
  artistId: string,
  view: string,
  maxItems: number = 100,
): Promise<AppleArtistAlbum[]> {
  const cacheKey = `am-artist-view:${artistId}:${view}`;
  const cached = albumCache.get(cacheKey);
  if (cached) return cached as AppleArtistAlbum[];

  const all: AppleArtistAlbum[] = [];
  let offset = 0;
  const limit = Math.min(maxItems, 25);

  while (all.length < maxItems) {
    const data = await appleMusicFetch<any>(
      `/catalog/${STOREFRONT}/artists/${artistId}/view/${view}?limit=${limit}&offset=${offset}`,
    );

    const items = data?.data || [];
    if (items.length === 0) break;

    all.push(...parseAlbumItems(items));

    if (items.length < limit || all.length >= maxItems) break;
    offset += limit;
  }

  const sorted = sortByDateDesc(all);
  if (sorted.length > 0) {
    albumCache.set(cacheKey, sorted, 86400);
  }
  return sorted;
}

/**
 * Get curated full albums for an artist (matches Apple Music website "Albums" section)
 */
export async function getArtistFullAlbums(
  artistId: string,
): Promise<AppleArtistAlbum[]> {
  return fetchArtistView(artistId, "full-albums", 200);
}

/**
 * Get singles & EPs for an artist (matches Apple Music website "Singles & EPs" section)
 */
export async function getArtistSingles(
  artistId: string,
): Promise<AppleArtistAlbum[]> {
  return fetchArtistView(artistId, "singles", 200);
}

// ─── Artist Top Songs ────────────────────────────────────────────────────────

export interface AppleTopSong {
  id: string;
  name: string;
  artistName: string;
  artistId?: string;
  albumName?: string;
  albumId?: string;
  artworkUrl?: string;
  releaseDate?: string;
  durationMs?: number;
  trackNumber?: number;
  url?: string;
}

// ─── Album Detail + Tracks ────────────────────────────────────────────────────

export interface AppleAlbumDetail {
  id: string;
  name: string;
  artistName: string;
  artistId?: string;
  artworkUrl?: string;
  releaseDate?: string;
  trackCount: number;
  genreNames: string[];
  isSingle: boolean;
  isCompilation: boolean;
  isComplete: boolean;
  contentRating?: string;
  copyright?: string;
  editorialNotes?: string;
  url?: string;
  tracks: AppleTrack[];
  otherVersions?: {
    id: string;
    name: string;
    artworkUrl?: string;
    releaseDate?: string;
    isSingle?: boolean;
    isCompilation?: boolean;
    trackCount?: number;
  }[];
}

export interface AppleTrack {
  id: string;
  name: string;
  artistName: string;
  artistId?: string;
  trackNumber: number;
  discNumber: number;
  durationMs: number;
  artworkUrl?: string;
  url?: string;
  hasLyrics?: boolean;
  genreNames?: string[];
}

/**
 * Get album details including all tracks
 */
export async function getAlbumDetail(
  albumId: string,
): Promise<AppleAlbumDetail | null> {
  const cacheKey = `am-album-detail:${albumId}`;
  const cached = albumCache.get(cacheKey);
  if (cached) return cached as AppleAlbumDetail;

  // Fetch album with tracks relationship and other-versions view
  const data = await appleMusicFetch<any>(
    `/catalog/${STOREFRONT}/albums/${albumId}?include=tracks,artists&views=other-versions`,
  );

  const item = data?.data?.[0];
  if (!item) return null;

  const a = item.attributes || {};
  const artistRel = item.relationships?.artists?.data?.[0];
  const trackItems = item.relationships?.tracks?.data || [];

  const tracks: AppleTrack[] = trackItems.map((t: any) => {
    const ta = t.attributes || {};
    const trackArtistRel = t.relationships?.artists?.data?.[0];
    return {
      id: t.id,
      name: ta.name || "",
      artistName: ta.artistName || "",
      artistId: trackArtistRel?.id,
      trackNumber: ta.trackNumber || 0,
      discNumber: ta.discNumber || 1,
      durationMs: ta.durationInMillis || 0,
      artworkUrl: ta.artwork?.url,
      url: ta.url,
      hasLyrics: ta.hasLyrics,
      genreNames: ta.genreNames || [],
    };
  });

  // Sort tracks by disc number then track number
  tracks.sort((a, b) => {
    if (a.discNumber !== b.discNumber) return a.discNumber - b.discNumber;
    return a.trackNumber - b.trackNumber;
  });

  const result: AppleAlbumDetail = {
    id: item.id,
    name: a.name || "",
    artistName: a.artistName || "",
    artistId: artistRel?.id,
    artworkUrl: a.artwork?.url,
    releaseDate: a.releaseDate,
    trackCount: a.trackCount || tracks.length,
    genreNames: a.genreNames || [],
    isSingle: a.isSingle === true,
    isCompilation: a.isCompilation === true,
    isComplete: a.isComplete === true,
    contentRating: a.contentRating,
    copyright: a.copyright,
    editorialNotes:
      a.editorialNotes?.standard || a.editorialNotes?.short || undefined,
    url: a.url,
    tracks,
    otherVersions: (item.views?.["other-versions"]?.data || []).map(
      (v: any) => {
        const va = v.attributes || {};
        return {
          id: v.id,
          name: va.name || "",
          artworkUrl: va.artwork?.url,
          releaseDate: va.releaseDate,
          isSingle: va.isSingle === true,
          isCompilation: va.isCompilation === true,
          trackCount: va.trackCount,
        };
      },
    ),
  };

  albumCache.set(cacheKey, result, 86400);
  return result;
}
