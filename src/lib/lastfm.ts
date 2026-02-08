import { searchCache } from "@/lib/cache";

const LASTFM_BASE_URL = "https://ws.audioscrobbler.com/2.0/";

/** Fetch with a hard timeout to cap worst-case latency */
async function fetchWithTimeout(
  url: string,
  init: RequestInit & { next?: any } = {},
  timeoutMs: number = 3000,
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

interface PopularityResponse {
  [titleKey: string]: number;
}

// ─── Last.fm Track Search Result ───────────────────────────────────────────────

export interface LastFmTrack {
  name: string;
  artist: string;
  /** Last.fm listener count — the real popularity signal */
  listeners: number;
  /** Last.fm total play count — actual total listens */
  playcount?: number;
  /** MusicBrainz recording ID (may be empty string) */
  mbid: string;
}

/**
 * Fetch playcounts for a limited number of tracks using track.getInfo.
 * Only called for top results to avoid slowing down search.
 */
export async function fetchTrackPlaycounts(
  tracks: { name: string; artist: string }[],
): Promise<Map<string, number>> {
  const apiKey = process.env.LASTFM_API_KEY;
  if (!apiKey || tracks.length === 0) return new Map();

  const playcounts = new Map<string, number>();

  // Limit to top 10 tracks to avoid excessive API calls
  const limitedTracks = tracks.slice(0, 10);

  // Fire all requests in parallel — Last.fm allows ~5 req/sec,
  // and these are lightweight getInfo calls with Next.js revalidation caching
  const promises = limitedTracks.map(async (track) => {
    try {
      const url = `${LASTFM_BASE_URL}?method=track.getInfo&artist=${encodeURIComponent(
        track.artist,
      )}&track=${encodeURIComponent(track.name)}&api_key=${apiKey}&format=json`;

      const fetchInit: any = {};
      if (process.env.NODE_ENV !== "test") {
        fetchInit.next = { revalidate: 1800 };
      }

      const res = await fetchWithTimeout(url, fetchInit, 2500);
      if (!res.ok) return;

      const data = await res.json();
      const playcount = parseInt(data?.track?.playcount, 10);
      if (playcount > 0) {
        const key = `${track.artist}:${track.name}`;
        playcounts.set(key, playcount);
      }
    } catch (err) {
      // Silently fail - playcount is optional enrichment
    }
  });

  await Promise.all(promises);

  return playcounts;
}

/**
 * Search Last.fm for tracks. Returns results sorted by popularity (listener count).
 * This is the key to surfacing famous songs like "Billie Jean" by MJ over covers.
 *
 * @param query   Search query (e.g., "Billie Jean")
 * @param limit   Max results to return (default 30)
 * @returns       Array of LastFmTrack sorted by listener count (descending)
 */
export async function searchLastFmTracks(
  query: string,
  limit: number = 30,
  maxEnrich: number = 10,
): Promise<LastFmTrack[]> {
  const apiKey = process.env.LASTFM_API_KEY;
  if (!apiKey) return [];

  // In-memory cache (keyed by query+limit+maxEnrich)
  const cacheKey = `lfm:track:${query.toLowerCase().trim()}:${limit}:${maxEnrich}`;
  const cached = searchCache.get(cacheKey);
  if (cached) return cached as LastFmTrack[];

  try {
    const url = `${LASTFM_BASE_URL}?method=track.search&track=${encodeURIComponent(
      query,
    )}&api_key=${apiKey}&format=json&limit=${limit}`;

    const fetchInit: any = {};
    if (process.env.NODE_ENV !== "test") {
      fetchInit.next = { revalidate: 1800 };
    }

    const res = await fetchWithTimeout(url, fetchInit, 3000);
    if (!res.ok) return [];

    const data = await res.json();
    const tracks = data?.results?.trackmatches?.track;
    if (!Array.isArray(tracks)) return [];

    const results = tracks.map((t: any) => ({
      name: t.name || "",
      artist: t.artist || "",
      listeners: parseInt(t.listeners, 10) || 0,
      mbid: t.mbid || "",
    }));

    // Fetch playcounts for top results only (to avoid slowing down search)
    if (maxEnrich <= 0) {
      searchCache.set(cacheKey, results, 1800);
      return results;
    }
    const playcounts = await fetchTrackPlaycounts(results.slice(0, maxEnrich));

    // Merge playcounts back into results
    const enriched = results.map((track) => {
      const key = `${track.artist}:${track.name}`;
      return {
        ...track,
        playcount: playcounts.get(key),
      };
    });
    searchCache.set(cacheKey, enriched, 1800);
    return enriched;
  } catch (err) {
    console.error("Last.fm track search error:", err);
    return [];
  }
}

// ─── Last.fm Album Search Result ──────────────────────────────────────────────

export interface LastFmAlbum {
  name: string;
  artist: string;
  /** Last.fm listener count — popularity signal (from album.getInfo) */
  listeners: number;
  /** MusicBrainz release-group ID (may be empty string) */
  mbid: string;
}

/**
 * Fetch listener counts for a limited number of albums using album.getInfo.
 * Only called for top results to avoid slowing down search.
 */
async function fetchAlbumListeners(
  albums: { name: string; artist: string }[],
): Promise<Map<string, number>> {
  const apiKey = process.env.LASTFM_API_KEY;
  if (!apiKey || albums.length === 0) return new Map();

  const listeners = new Map<string, number>();
  const limitedAlbums = albums.slice(0, 10);

  const batchSize = 5;
  for (let i = 0; i < limitedAlbums.length; i += batchSize) {
    const batch = limitedAlbums.slice(i, i + batchSize);

    const promises = batch.map(async (album) => {
      try {
        const url = `${LASTFM_BASE_URL}?method=album.getInfo&artist=${encodeURIComponent(
          album.artist,
        )}&album=${encodeURIComponent(album.name)}&api_key=${apiKey}&format=json`;

        const fetchInit: any = {};
        if (process.env.NODE_ENV !== "test") {
          fetchInit.next = { revalidate: 1800 };
        }

        const res = await fetchWithTimeout(url, fetchInit, 2500);
        if (!res.ok) return;

        const data = await res.json();
        const listenerCount = parseInt(data?.album?.listeners, 10);
        if (listenerCount > 0) {
          const key = `${album.artist}:${album.name}`;
          listeners.set(key, listenerCount);
        }
      } catch (err) {
        // Silently fail - listener count is optional enrichment
      }
    });

    await Promise.all(promises);

    if (i + batchSize < limitedAlbums.length) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }

  return listeners;
}

/**
 * Search Last.fm for albums. Returns results with popularity signals.
 * Last.fm album.search doesn't return listeners directly, so we enrich
 * top results with album.getInfo to get actual listener counts.
 *
 * @param query   Search query (e.g., "Thriller")
 * @param limit   Max results to return (default 30)
 * @returns       Array of LastFmAlbum with listener counts
 */
export async function searchLastFmAlbums(
  query: string,
  limit: number = 30,
  maxEnrich: number = 10,
): Promise<LastFmAlbum[]> {
  const apiKey = process.env.LASTFM_API_KEY;
  if (!apiKey) return [];

  // In-memory cache
  const cacheKey = `lfm:album:${query.toLowerCase().trim()}:${limit}:${maxEnrich}`;
  const cached = searchCache.get(cacheKey);
  if (cached) return cached as LastFmAlbum[];

  try {
    const url = `${LASTFM_BASE_URL}?method=album.search&album=${encodeURIComponent(
      query,
    )}&api_key=${apiKey}&format=json&limit=${limit}`;

    const fetchInit: any = {};
    if (process.env.NODE_ENV !== "test") {
      fetchInit.next = { revalidate: 1800 };
    }

    const res = await fetchWithTimeout(url, fetchInit, 3000);
    if (!res.ok) return [];

    const data = await res.json();
    const albums = data?.results?.albummatches?.album;
    if (!Array.isArray(albums)) return [];

    const results = albums.map((a: any) => ({
      name: a.name || "",
      artist: a.artist || "",
      listeners: 0,
      mbid: a.mbid || "",
    }));

    // Fetch listener counts for top results
    if (maxEnrich <= 0) {
      searchCache.set(cacheKey, results, 1800);
      return results;
    }
    const listenerMap = await fetchAlbumListeners(results.slice(0, maxEnrich));

    const enriched = results.map((album) => {
      const key = `${album.artist}:${album.name}`;
      return {
        ...album,
        listeners: listenerMap.get(key) || 0,
      };
    });
    searchCache.set(cacheKey, enriched, 1800);
    return enriched;
  } catch (err) {
    console.error("Last.fm album search error:", err);
    return [];
  }
}

// ─── Last.fm Artist Search Result ─────────────────────────────────────────────

export interface LastFmArtist {
  name: string;
  /** Last.fm listener count */
  listeners: number;
  /** MusicBrainz artist ID (may be empty string) */
  mbid: string;
  /** Last.fm URL */
  url: string;
}

/**
 * Search Last.fm for artists. Returns results sorted by relevance.
 * Enriches top results with artist.getInfo to get listener counts and tags.
 */
export async function searchLastFmArtists(
  query: string,
  limit: number = 30,
  maxEnrich: number = 5,
): Promise<(LastFmArtist & { tags?: string[] })[]> {
  const apiKey = process.env.LASTFM_API_KEY;
  if (!apiKey) return [];

  const cacheKey = `lfm:artist:${query.toLowerCase().trim()}:${limit}:${maxEnrich}`;
  const cached = searchCache.get(cacheKey);
  if (cached) return cached as (LastFmArtist & { tags?: string[] })[];

  try {
    const url = `${LASTFM_BASE_URL}?method=artist.search&artist=${encodeURIComponent(
      query,
    )}&api_key=${apiKey}&format=json&limit=${limit}`;

    const fetchInit: any = {};
    if (process.env.NODE_ENV !== "test") {
      fetchInit.next = { revalidate: 1800 };
    }

    const res = await fetchWithTimeout(url, fetchInit, 3000);
    if (!res.ok) return [];

    const data = await res.json();
    const artists = data?.results?.artistmatches?.artist;
    if (!Array.isArray(artists)) return [];

    const results: (LastFmArtist & { tags?: string[] })[] = artists.map(
      (a: any) => ({
        name: a.name || "",
        listeners: parseInt(a.listeners, 10) || 0,
        mbid: a.mbid || "",
        url: a.url || "",
      }),
    );

    // Enrich top results with artist.getInfo for tags and accurate listener counts
    if (maxEnrich > 0) {
      const toEnrich = results.slice(0, maxEnrich);
      const enrichPromises = toEnrich.map(async (artist) => {
        try {
          const infoUrl = `${LASTFM_BASE_URL}?method=artist.getInfo&artist=${encodeURIComponent(
            artist.name,
          )}&api_key=${apiKey}&format=json`;

          const infoInit: any = {};
          if (process.env.NODE_ENV !== "test") {
            infoInit.next = { revalidate: 1800 };
          }

          const infoRes = await fetchWithTimeout(infoUrl, infoInit, 2500);
          if (!infoRes.ok) return;

          const infoData = await infoRes.json();
          const info = infoData?.artist;
          if (!info) return;

          // Update listener count from getInfo (more accurate)
          const listeners = parseInt(info?.stats?.listeners, 10);
          if (listeners > 0) artist.listeners = listeners;

          // Get mbid if missing
          if (!artist.mbid && info.mbid) artist.mbid = info.mbid;

          // Extract top tags
          const tags = info?.tags?.tag;
          if (Array.isArray(tags) && tags.length > 0) {
            artist.tags = tags.slice(0, 3).map((t: any) => t.name || "");
          }
        } catch {
          // Silently fail — enrichment is optional
        }
      });
      await Promise.all(enrichPromises);
    }

    searchCache.set(cacheKey, results, 1800);
    return results;
  } catch (err) {
    console.error("Last.fm artist search error:", err);
    return [];
  }
}

export async function getArtistPopularity(
  artistName: string,
): Promise<PopularityResponse> {
  const apiKey = process.env.LASTFM_API_KEY;
  if (!apiKey) {
    console.error(
      "Missing LASTFM_API_KEY environment variable. Popularity sorting will not work.",
    );
    return {};
  }

  if (!artistName) return {};

  try {
    // Limit 500 to get a good coverage of discography.
    // We use artist name because MBID support in Last.fm can be spotty.
    const url = `${LASTFM_BASE_URL}?method=artist.gettopalbums&artist=${encodeURIComponent(
      artistName,
    )}&api_key=${apiKey}&format=json&limit=500`;

    const fetchInit: any = {};
    if (process.env.NODE_ENV !== "test") {
      fetchInit.next = { revalidate: 86400 };
    }

    const res = await fetchWithTimeout(url, fetchInit, 5000);
    const data = await res.json();

    if (!data.topalbums || !data.topalbums.album) {
      console.warn("Last.fm: No albums found for", artistName);
      return {};
    }

    const popularityMap: PopularityResponse = {};
    const albums = Array.isArray(data.topalbums.album)
      ? data.topalbums.album
      : [data.topalbums.album];

    albums.forEach((album: any) => {
      if (album.name && album.playcount) {
        const key = album.name.toLowerCase().trim();
        const playcount = parseInt(album.playcount, 10);

        if (!popularityMap[key] || playcount > popularityMap[key]) {
          popularityMap[key] = playcount;
        }
      }
    });

    return popularityMap;
  } catch (error) {
    console.error("Error fetching Last.fm popularity:", error);
    return {};
  }
}
