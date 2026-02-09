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

async function appleMusicFetch<T>(path: string): Promise<T | null> {
  const headers = await getAppleMusicHeaders();
  if (!headers) {
    console.error("Apple Music: failed to get auth headers");
    return null;
  }

  const url = `${APPLE_MUSIC_BASE_URL}${path}`;

  try {
    const res = await fetch(url, {
      headers,
      next: { revalidate: 3600 },
    });

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
    console.error("Apple Music fetch error for", url, ":", err);
    return null;
  }
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
    albumId: albumRel?.id,
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
    // Apple marks both singles and EPs as isSingle=true
    // EPs typically have 4-6 tracks, or "EP" in the name
    if (
      album.name.toLowerCase().includes(" ep") ||
      album.name.toLowerCase().includes("(ep)") ||
      album.name.toLowerCase().endsWith(" - ep") ||
      (album.trackCount && album.trackCount >= 4 && album.trackCount <= 6)
    ) {
      return "EP";
    }
    return "Single";
  }
  return "Album";
}

/**
 * Get all albums for an artist (paginated, fetches all)
 */
export async function getArtistAlbums(
  artistId: string,
): Promise<AppleArtistAlbum[]> {
  const cacheKey = `am-artist-albums:${artistId}`;
  const cached = albumCache.get(cacheKey);
  if (cached) return cached as AppleArtistAlbum[];

  const allAlbums: AppleArtistAlbum[] = [];
  let offset = 0;
  const limit = 100;
  let hasMore = true;

  while (hasMore) {
    const data = await appleMusicFetch<any>(
      `/catalog/${STOREFRONT}/artists/${artistId}/albums?limit=${limit}&offset=${offset}`,
    );

    const items = data?.data || [];
    if (items.length === 0) {
      hasMore = false;
      break;
    }

    for (const item of items) {
      const a = item.attributes || {};
      allAlbums.push({
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
      });
    }

    if (items.length < limit) {
      hasMore = false;
    } else {
      offset += limit;
    }
  }

  // Sort by release date descending
  allAlbums.sort((a, b) =>
    (b.releaseDate || "").localeCompare(a.releaseDate || ""),
  );

  albumCache.set(cacheKey, allAlbums, 86400);
  return allAlbums;
}

/**
 * Group artist albums into categories: Albums, EPs, Singles, Compilations
 */
export function groupArtistAlbums(albums: AppleArtistAlbum[]): {
  albums: AppleArtistAlbum[];
  eps: AppleArtistAlbum[];
  singles: AppleArtistAlbum[];
  compilations: AppleArtistAlbum[];
} {
  const result = {
    albums: [] as AppleArtistAlbum[],
    eps: [] as AppleArtistAlbum[],
    singles: [] as AppleArtistAlbum[],
    compilations: [] as AppleArtistAlbum[],
  };

  for (const album of albums) {
    const type = classifyAlbumType(album);
    switch (type) {
      case "Album":
        result.albums.push(album);
        break;
      case "EP":
        result.eps.push(album);
        break;
      case "Single":
        result.singles.push(album);
        break;
      case "Compilation":
        result.compilations.push(album);
        break;
    }
  }

  return result;
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

  // Fetch album with tracks relationship included
  const data = await appleMusicFetch<any>(
    `/catalog/${STOREFRONT}/albums/${albumId}?include=tracks,artists`,
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
  };

  albumCache.set(cacheKey, result, 86400);
  return result;
}
