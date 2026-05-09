/**
 * Apple Music API Client
 * Replaces MusicBrainz, Last.fm, Wikidata, and ListenBrainz
 */

import { getAppleMusicHeaders, APPLE_MUSIC_BASE_URL } from "./auth";
import {
  searchCache,
  artistCache,
  albumCache,
  playlistCache,
} from "@/lib/cache";

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
        // 404 with "No related resources" is expected when paginating past the end
        if (res.status === 404) {
          return null;
        }
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
  artists?: { id: string; name: string }[];
  albumName?: string;
  albumId?: string;
  artworkUrl?: string;
  releaseDate?: string;
  durationMs?: number;
  trackNumber?: number;
  discNumber?: number;
  genreNames?: string[];
  url?: string;
  hasLyrics?: boolean;
}

/** Primary + featured credits from a catalog `songs` resource (deduped by id). */
function artistsFromCatalogSongResource(song: {
  relationships?: {
    artists?: { data?: Array<{ id: string; attributes?: { name?: string } }> };
    "featured-artists"?: {
      data?: Array<{ id: string; attributes?: { name?: string } }>;
    };
  };
}): { id: string; name: string }[] {
  const refs = [
    ...(song.relationships?.artists?.data || []),
    ...(song.relationships?.["featured-artists"]?.data || []),
  ];
  const unique = Array.from(new Map(refs.map((r) => [r.id, r])).values());
  return unique
    .map((ar) => ({
      id: ar.id,
      name: (ar.attributes?.name || "").trim(),
    }))
    .filter((x) => x.id && x.name);
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
  const cacheKey = `am-artist-full-v3:${artistId}`;
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

  if (topSongs.length > 0) {
    const ids = topSongs.map((t) => t.id).join(",");
    const songsData = await appleMusicFetch<any>(
      `/catalog/${STOREFRONT}/songs?ids=${ids}&include=artists,albums`,
    );
    if (songsData?.data) {
      const artistMap = new Map<string, { id: string; name: string }[]>();
      for (const song of songsData.data) {
        artistMap.set(song.id, artistsFromCatalogSongResource(song));
      }
      for (const ts of topSongs) {
        const list = artistMap.get(ts.id);
        if (list && list.length > 0) {
          ts.artists = list;
          ts.artistId = list[0].id;
        } else if (artist.id && ts.artistName) {
          ts.artists = [{ id: artist.id, name: ts.artistName }];
        }
      }
    } else {
      for (const ts of topSongs) {
        if (artist.id && ts.artistName) {
          ts.artists = [{ id: artist.id, name: ts.artistName }];
        }
      }
    }
  }

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
  artists?: { id: string; name: string }[];
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
  /**
   * Primary album artist resolved from relationships.artists[0].
   * Apple's attributes.artistName can be a display string like "A & B".
   */
  primaryArtistName?: string;
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
  artists?: { id: string; name: string }[];
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
  // include[tracks]=artists fetches all artists (including featured) per track
  const data = await appleMusicFetch<any>(
    `/catalog/${STOREFRONT}/albums/${albumId}?include=tracks,artists&include[songs]=artists,featured-artists&views=other-versions`,
  );

  const item = data?.data?.[0];
  if (!item) return null;

  const a = item.attributes || {};
  const artistRel = item.relationships?.artists?.data?.[0];
  const trackItems = item.relationships?.tracks?.data || [];

  // Create a map of included resources for quick lookup
  const includedMap: Record<string, any> = {};
  if (data.included) {
    data.included.forEach((inc: any) => {
      includedMap[`${inc.type}:${inc.id}`] = inc;
    });
  }

  const albumArtistName = a.artistName || "";
  const primaryArtistName =
    (artistRel?.id
      ? includedMap[`artists:${artistRel.id}`]?.attributes?.name
      : undefined) || undefined;

  const tracks: AppleTrack[] = trackItems.map((t: any) => {
    const ta = t.attributes || {};

    // Resolve all artists/featured-artists for this track from the included map
    const artistRefs = [
      ...(t.relationships?.artists?.data || []),
      ...(t.relationships?.["featured-artists"]?.data || []),
    ];

    // De-duplicate by ID to avoid overlapping primary and featured lists
    const uniqueRefs = Array.from(
      new Map(artistRefs.map((r: any) => [r.id, r])).values(),
    );

    const songArtists = uniqueRefs
      .map((ref: any) => includedMap[`artists:${ref.id}`] || ref)
      .map(parseArtist);

    const primaryArtist = songArtists[0];
    return {
      id: t.id,
      name: ta.name || "",
      artistName: ta.artistName || "",
      artistId: primaryArtist?.id,
      trackNumber: ta.trackNumber || 0,
      discNumber: ta.discNumber || 1,
      durationMs: ta.durationInMillis || 0,
      artworkUrl: ta.artwork?.url,
      url: ta.url,
      hasLyrics: ta.hasLyrics,
      genreNames: ta.genreNames || [],
      artists: songArtists,
    };
  });

  // Apple Music's nested include[tracks]=artists doesn't return artist
  // relationships on the albums endpoint.  For tracks whose artistName
  // differs from the album artist (i.e. they have featured artists),
  // batch-fetch via /songs?ids=…&include=artists to get proper IDs.
  const tracksNeedingArtists = tracks.filter(
    (t) =>
      (!t.artists || t.artists.length === 0) &&
      t.artistName !== albumArtistName,
  );

  if (tracksNeedingArtists.length > 0) {
    const ids = tracksNeedingArtists.map((t) => t.id).join(",");
    const songsData = await appleMusicFetch<any>(
      `/catalog/${STOREFRONT}/songs?ids=${ids}&include=artists`,
    );

    if (songsData?.data) {
      const artistMap = new Map<string, { id: string; name: string }[]>();
      for (const song of songsData.data) {
        artistMap.set(song.id, artistsFromCatalogSongResource(song));
      }

      for (const track of tracksNeedingArtists) {
        const resolved = artistMap.get(track.id);
        if (resolved && resolved.length > 0) {
          track.artists = resolved;
          if (!track.artistId) {
            track.artistId = resolved[0].id;
          }
        }
      }
    }
  }

  // Sort tracks by disc number then track number
  tracks.sort((a, b) => {
    if (a.discNumber !== b.discNumber) return a.discNumber - b.discNumber;
    return a.trackNumber - b.trackNumber;
  });

  const result: AppleAlbumDetail = {
    id: item.id,
    name: a.name || "",
    artistName: a.artistName || "",
    primaryArtistName,
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

// ─── Playlists ────────────────────────────────────────────────────────────────

export interface ApplePlaylistResult {
  id: string;
  name: string;
  curatorName: string;
  artworkUrl?: string;
  description?: string;
  url?: string;
}

export function parsePlaylist(item: any): ApplePlaylistResult {
  const a = item.attributes || {};
  return {
    id: item.id,
    name: a.name || "",
    curatorName: a.curatorName || "",
    artworkUrl: a.artwork?.url,
    description: a.description?.standard || a.description?.short || "",
    url: a.url,
  };
}

/**
 * Apple Music Official Top 100 Playlist IDs
 */
export const TOP_100_PLAYLIST_IDS = [
  "pl.d25f5d1181894928af76c85c967f8f31", // Top 100: Global
  "pl.606afcbb70264d2eb2b51d8dbcfa6a12", // Top 100: USA
  "pl.c121e42ba15949aba848d795a05b2df5", // Top 100: UK
  "pl.23a4b6562b324ceb8dbbbdcdd13da2ef", // Top 100: Canada
  "pl.4fc87e86cfab4a1eaa26edcc3fba8836", // Top 100: Australia
  "pl.c86f26485ff743a3bb0f1c9fc1ae29e7", // Top 100: Mexico
  "pl.043a2c9876114d95a4659988497567be", // Top 100: Japan
  "pl.11ac7cc7d09741c5822e8c66e5c7edbb", // Top 100: Brazil
  "pl.6e8cfd81d51042648fa36c9df5236b8d", // Top 100: France
  "pl.c10a2c113db14685a0b09fa5834d8e8b", // Top 100: Germany
  "pl.2fc68f6d68004ae993dadfe99de83877", // Top 100: Nigeria
  "pl.d116fa6286734b74acff3d38a740fe0d", // Top 100: Colombia
];

/**
 * Get trending songs (top tracks from Global Top 100 playlist)
 */
export async function getTrendingSongs(
  limit: number = 10,
): Promise<AppleSongResult[]> {
  // IMPORTANT: The full playlist detail call enriches *all* tracks (up to 100)
  // with a second /songs?ids=... batch call. The homepage only needs a handful,
  // so we fetch + enrich only the first N tracks to keep TTFB low.
  const playlistId = TOP_100_PLAYLIST_IDS[0]; // Global Top 100
  const safeLimit = Math.max(1, Math.min(limit, 25));

  const cacheKey = `am-trending-songs-${STOREFRONT}-${playlistId}-${safeLimit}`;
  const cached = playlistCache.get(cacheKey);
  if (cached) return cached as AppleSongResult[];

  const data = await appleMusicFetch<any>(
    `/catalog/${STOREFRONT}/playlists/${playlistId}?include=tracks`,
  );

  const item = data?.data?.[0];
  if (!item) return [];

  const trackItems = (item.relationships?.tracks?.data || []).slice(0, safeLimit);

  const tracks: AppleSongResult[] = trackItems.map((t: any) => {
    const ta = t.attributes || {};
    return {
      id: t.id,
      name: ta.name || "",
      artistName: ta.artistName || "",
      trackNumber: ta.trackNumber || 0,
      discNumber: ta.discNumber || 1,
      durationMs: ta.durationInMillis || 0,
      artworkUrl: ta.artwork?.url,
      url: ta.url,
      hasLyrics: ta.hasLyrics,
      genreNames: ta.genreNames || [],
      albumName: ta.albumName,
      albumId: extractAlbumIdFromUrl(ta.url),
    } as any;
  });

  // Enrich only these N tracks for clickable artist/album links.
  if (tracks.length > 0) {
    const ids = tracks.map((t) => t.id).join(",");
    const songsData = await appleMusicFetch<{
      data?: Array<{
        id: string;
        relationships?: {
          artists?: {
            data?: Array<{ id: string; attributes?: { name?: string } }>;
          };
          albums?: { data?: Array<{ id: string }> };
        };
      }>;
    }>(`/catalog/${STOREFRONT}/songs?ids=${ids}&include=artists,albums`);

    if (songsData?.data) {
      const enrichmentMap = new Map<
        string,
        { artists: { id: string; name: string }[]; albumId?: string }
      >();

      for (const song of songsData.data) {
        const songAlbum = song.relationships?.albums?.data?.[0];
        enrichmentMap.set(song.id, {
          artists: artistsFromCatalogSongResource(song),
          albumId: songAlbum?.id,
        });
      }

      for (const track of tracks) {
        const enriched = enrichmentMap.get(track.id);
        if (!enriched) continue;
        if (enriched.artists.length > 0) {
          track.artists = enriched.artists;
          track.artistId = enriched.artists[0].id;
        }
        if (enriched.albumId) {
          track.albumId = enriched.albumId;
        }
      }
    }
  }

  playlistCache.set(cacheKey, tracks, 3600 * 2);
  return tracks;
}

/**
 * Get Daily Top 100 playlists from Apple Music
 */
export async function getDailyTop100Playlists(
  storefront: string = STOREFRONT,
  limit: number = 12,
): Promise<ApplePlaylistResult[]> {
  const idsParam = TOP_100_PLAYLIST_IDS.slice(0, limit).join(",");
  const cacheKey = `am-daily-top-100-ids-${storefront}-${idsParam}`;
  const cached = playlistCache.get(cacheKey);
  if (cached) return cached as ApplePlaylistResult[];

  const data = await appleMusicFetch<any>(
    `/catalog/${storefront}/playlists?ids=${idsParam}`,
  );

  const playlistsData = data?.data || [];

  // Sort them so they match the order of the requested IDs
  const parsed = playlistsData.map(parsePlaylist);
  const playlists = TOP_100_PLAYLIST_IDS.slice(0, limit)
    .map((id) => parsed.find((p: any) => p.id === id))
    .filter(Boolean) as ApplePlaylistResult[];

  if (playlists.length > 0) {
    playlistCache.set(cacheKey, playlists, 3600 * 12);
  }

  return playlists;
}

export interface ApplePlaylistDetail extends ApplePlaylistResult {
  tracks: AppleSongResult[];
  trackCount: number;
}

/**
 * Get detailed playlist information including tracks
 */
export async function getPlaylistDetail(
  playlistId: string,
  storefront: string = STOREFRONT,
): Promise<ApplePlaylistDetail | null> {
  const cacheKey = `am-playlist-detail-${storefront}-${playlistId}`;
  const cached = playlistCache.get(cacheKey);
  if (cached) return cached as ApplePlaylistDetail;

  const data = await appleMusicFetch<any>(
    `/catalog/${storefront}/playlists/${playlistId}?include=tracks`,
  );

  const item = data?.data?.[0];
  if (!item) return null;

  const basePlaylist = parsePlaylist(item);
  const trackItems = item.relationships?.tracks?.data || [];

  const tracks: AppleSongResult[] = trackItems.map((t: any) => {
    const ta = t.attributes || {};
    return {
      id: t.id,
      name: ta.name || "",
      artistName: ta.artistName || "",
      trackNumber: ta.trackNumber || 0,
      discNumber: ta.discNumber || 1,
      durationMs: ta.durationInMillis || 0,
      artworkUrl: ta.artwork?.url,
      url: ta.url,
      hasLyrics: ta.hasLyrics,
      genreNames: ta.genreNames || [],
      // For playlist tracks, the album associated to the track isn't included in the relationship.
      // Easiest is to fall back to the text field albumName. Wait until user enters album.
      albumName: ta.albumName,
      albumId: extractAlbumIdFromUrl(ta.url),
    } as any;
  });

  // Enrich tracks with artist relationships (for clickable artist links).
  // Apple Music's playlist endpoint doesn't include artist relationships on
  // nested tracks, so we batch-fetch the songs to get artistId + artists[].
  if (tracks.length > 0) {
    const ids = tracks.map((t) => t.id).join(",");
    const songsData = await appleMusicFetch<{
      data?: Array<{
        id: string;
        relationships?: {
          artists?: {
            data?: Array<{ id: string; attributes?: { name?: string } }>;
          };
          albums?: { data?: Array<{ id: string }> };
        };
      }>;
    }>(`/catalog/${storefront}/songs?ids=${ids}&include=artists,albums`);

    if (songsData?.data) {
      const enrichmentMap = new Map<
        string,
        {
          artists: { id: string; name: string }[];
          albumId?: string;
        }
      >();
      for (const song of songsData.data) {
        const songAlbum = song.relationships?.albums?.data?.[0];
        enrichmentMap.set(song.id, {
          artists: artistsFromCatalogSongResource(song),
          albumId: songAlbum?.id,
        });
      }

      for (const track of tracks) {
        const enriched = enrichmentMap.get(track.id);
        if (enriched) {
          if (enriched.artists.length > 0) {
            track.artists = enriched.artists;
            track.artistId = enriched.artists[0].id;
          }
          if (enriched.albumId) {
            track.albumId = enriched.albumId;
          }
        }
      }
    }
  }

  const result: ApplePlaylistDetail = {
    ...basePlaylist,
    tracks,
    trackCount: tracks.length,
  };

  playlistCache.set(cacheKey, result, 3600 * 2);

  return result;
}
