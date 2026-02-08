/**
 * searchService.ts — Last.fm-Powered Search
 *
 * Uses Last.fm exclusively for search (artists, albums, tracks).
 * Results are ranked by Last.fm listener/playcount popularity.
 * MusicBrainz IDs from Last.fm are used for linking to artist/album pages.
 */

import { searchCache } from "@/lib/cache";
import {
  searchLastFmArtists,
  searchLastFmAlbums,
  searchLastFmTracks,
} from "@/lib/lastfm";
import { createSlug } from "@/lib/utils";
import type {
  SearchCategory,
  SearchResult,
  ArtistSearchResult,
  AlbumSearchResult,
  SongSearchResult,
  GroupedSearchResults,
} from "@/types/search";

// ─── Constants ─────────────────────────────────────────────────────────────────

const LASTFM_API_KEY =
  process.env.LASTFM_API_KEY || "b25b959554ed76058ac220b7b2e0a026";
const LASTFM_BASE_URL = "https://ws.audioscrobbler.com/2.0/";

/** How many results to fetch from Last.fm per type */
const FETCH_LIMITS = {
  single: { artists: 30, albums: 30, songs: 50 },
  all: { artists: 10, albums: 10, songs: 20 },
} as const;

/** How many final results to return per type */
const RETURN_LIMITS = {
  artists: 10,
  albums: 10,
  songs: 15,
  allArtists: 3,
  allAlbums: 3,
  allSongs: 8,
} as const;

/** How many results to enrich with getInfo calls */
const ENRICH_LIMITS = {
  single: { artists: 10, albums: 10, songs: 10 },
  all: { artists: 5, albums: 0, songs: 5 },
} as const;

// ─── In-flight Request Deduplication ───────────────────────────────────────────

const inflightRequests = new Map<string, Promise<any>>();

function deduplicatedFetch<T>(
  key: string,
  fetcher: () => Promise<T>,
): Promise<T> {
  const existing = inflightRequests.get(key);
  if (existing) return existing as Promise<T>;

  const promise = fetcher().finally(() => {
    inflightRequests.delete(key);
  });

  inflightRequests.set(key, promise);
  return promise;
}

// ─── Last.fm Fetch Helper ───────────────────────────────────────────────────────

async function fetchWithTimeout(
  url: string,
  init: RequestInit & { next?: any } = {},
  timeoutMs: number = 4000,
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

function buildLastFmUrl(params: Record<string, string>): string {
  const searchParams = new URLSearchParams({
    ...params,
    api_key: LASTFM_API_KEY,
    format: "json",
  });
  return `${LASTFM_BASE_URL}?${searchParams.toString()}`;
}

// ─── Utils ─────────────────────────────────────────────────────────────────────

export function isValidQuery(query: string): boolean {
  return (
    typeof query === "string" &&
    query.trim().length >= 1 &&
    query.trim().length <= 200
  );
}

export function isValidCategory(category: string): category is SearchCategory {
  return ["all", "artist", "album", "song"].includes(category);
}

function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

// ─── Artist Search ──────────────────────────────────────────────────────────────

async function searchArtists(
  query: string,
  limit: number = FETCH_LIMITS.single.artists,
  quick: boolean = false,
): Promise<ArtistSearchResult[]> {
  const cacheKey = `search:artist:lfm:${normalizeText(query)}:${limit}${quick ? ":quick" : ""}`;
  const cached = searchCache.get(cacheKey);
  if (cached) return cached as ArtistSearchResult[];

  return deduplicatedFetch(cacheKey, async () => {
    const maxEnrich = quick
      ? ENRICH_LIMITS.all.artists
      : ENRICH_LIMITS.single.artists;
    const lfmArtists = await searchLastFmArtists(query, limit, maxEnrich);
    if (lfmArtists.length === 0) return [];

    // Deduplicate by normalized name AND by mbid
    const seenNames = new Set<string>();
    const seenMbids = new Set<string>();
    const deduped = lfmArtists.filter((a) => {
      const nameKey = normalizeText(a.name);
      if (seenNames.has(nameKey)) return false;
      seenNames.add(nameKey);
      // Also deduplicate by mbid to avoid different name variants of the same artist
      if (a.mbid) {
        if (seenMbids.has(a.mbid)) return false;
        seenMbids.add(a.mbid);
      }
      return true;
    });

    const results: ArtistSearchResult[] = deduped
      .slice(0, RETURN_LIMITS.artists)
      .map((a, index) => ({
        id: a.mbid || `lfm-artist-${normalizeText(a.name)}`,
        type: "artist" as const,
        title: a.name,
        score: Math.max(100 - index * 5, 10),
        tags: a.tags,
      }));

    // Filter out results without a valid MusicBrainz ID (can't link to artist page)
    const validResults = results.filter(
      (r) => r.id && !r.id.startsWith("lfm-"),
    );

    if (validResults.length > 0) {
      searchCache.set(cacheKey, validResults, 1800);
    }

    // Pre-populate slug resolution cache so artist pages load instantly
    for (const r of validResults) {
      const slug = createSlug(r.title, r.id);
      searchCache.set(`resolve-artist:${slug}`, r.id, 86400);
    }

    return validResults;
  });
}

// ─── Album Search ───────────────────────────────────────────────────────────────

async function searchAlbums(
  query: string,
  limit: number = FETCH_LIMITS.single.albums,
  quick: boolean = false,
): Promise<AlbumSearchResult[]> {
  const cacheKey = `search:album:lfm:${normalizeText(query)}:${limit}${quick ? ":quick" : ""}`;
  const cached = searchCache.get(cacheKey);
  if (cached) return cached as AlbumSearchResult[];

  return deduplicatedFetch(cacheKey, async () => {
    const maxEnrich = quick
      ? ENRICH_LIMITS.all.albums
      : ENRICH_LIMITS.single.albums;
    const lfmAlbums = await searchLastFmAlbums(query, limit, maxEnrich);
    if (lfmAlbums.length === 0) return [];

    // Deduplicate by normalized artist:title
    const seen = new Set<string>();
    const deduped = lfmAlbums.filter((a) => {
      const key = `${normalizeText(a.artist)}:${normalizeText(a.name)}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    // Sort by listeners (descending) — most popular first
    const sorted = deduped.sort(
      (a, b) => (b.listeners || 0) - (a.listeners || 0),
    );

    const results: AlbumSearchResult[] = sorted
      .slice(0, RETURN_LIMITS.albums)
      .map((a, index) => ({
        id:
          a.mbid ||
          `lfm-album-${normalizeText(a.artist)}-${normalizeText(a.name)}`,
        type: "album" as const,
        title: a.name,
        subtitle: a.artist,
        score: Math.max(100 - index * 5, 10),
        artistName: a.artist,
        primaryType: "Album",
        secondaryTypes: [],
      }));

    // Filter out results without a valid MusicBrainz ID (can't link to album page)
    const validResults = results.filter(
      (r) => r.id && !r.id.startsWith("lfm-"),
    );

    if (validResults.length > 0) {
      searchCache.set(cacheKey, validResults, 1800);
    }

    // Pre-populate slug resolution cache so album pages load instantly
    for (const r of validResults) {
      const slug = createSlug(r.title, r.id);
      searchCache.set(`resolve-album:${slug}`, r.id, 86400);
    }

    return validResults;
  });
}

// ─── Song/Track Search ──────────────────────────────────────────────────────────

async function searchSongs(
  query: string,
  limit: number = FETCH_LIMITS.single.songs,
  quick: boolean = false,
): Promise<SongSearchResult[]> {
  const cacheKey = `search:song:lfm:${normalizeText(query)}:${limit}${quick ? ":quick" : ""}`;
  const cached = searchCache.get(cacheKey);
  if (cached) return cached as SongSearchResult[];

  return deduplicatedFetch(cacheKey, async () => {
    const maxEnrich = quick
      ? ENRICH_LIMITS.all.songs
      : ENRICH_LIMITS.single.songs;
    const lfmTracks = await searchLastFmTracks(query, limit, maxEnrich);
    if (lfmTracks.length === 0) return [];

    // Deduplicate by normalized artist:title
    const seen = new Set<string>();
    const deduped = lfmTracks.filter((t) => {
      const key = `${normalizeText(t.artist)}:${normalizeText(t.name)}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    // Sort by playcount (if available) then listeners — most popular first
    const sorted = deduped.sort((a, b) => {
      const aScore = a.playcount ?? a.listeners;
      const bScore = b.playcount ?? b.listeners;
      return bScore - aScore;
    });

    const top = sorted.slice(0, RETURN_LIMITS.songs);

    // Enrich with MusicBrainz recording search to get release-group IDs for linking.
    // In quick mode, limit to top 8 tracks to keep search fast.
    const tracksToEnrich = quick ? top.slice(0, 8) : top;
    const trackInfoMap = await fetchTrackInfoBatch(
      tracksToEnrich.map((t) => ({ name: t.name, artist: t.artist })),
    );

    const results: SongSearchResult[] = top.map((t, index) => {
      const infoKey = `${t.artist}:${t.name}`;
      const info = trackInfoMap.get(infoKey);
      const playcount = t.playcount ?? t.listeners;

      // Prefer mbid from search, fall back to mbid from track.getInfo
      const mbid = t.mbid || info?.trackMbid;

      return {
        id:
          mbid ||
          `lfm-track-${normalizeText(t.artist)}-${normalizeText(t.name)}`,
        type: "song" as const,
        title: t.name,
        subtitle: t.artist,
        score: Math.max(100 - index * 3, 10),
        artistName: t.artist,
        artistId: info?.artistMbid,
        releaseCount: 0,
        officialReleaseCount: 0,
        hasAlbumRelease: !!info?.albumTitle,
        firstReleaseDate: undefined,
        length: info?.duration,
        listenCount: playcount > 0 ? playcount : undefined,
        releaseGroupId: info?.albumMbid,
        releaseGroupTitle: info?.albumTitle,
        originalAlbumTitle: info?.albumTitle,
        releaseType: info?.albumTitle ? "Album" : undefined,
      };
    });

    if (results.length > 0) {
      searchCache.set(cacheKey, results, 1800);
    }
    return results;
  });
}

// ─── Track Info Enrichment ───────────────────────────────────────────────────────

const MB_BASE_URL = "https://musicbrainz.org/ws/2";
const MB_USER_AGENT = "SongRates/1.0 (mpittas@gmail.com)";

interface TrackInfo {
  trackMbid?: string;
  duration?: number;
  albumTitle?: string;
  albumMbid?: string;
  artistMbid?: string;
}

/**
 * Two-step enrichment for tracks:
 *   1. Last.fm track.getInfo → album title, artist mbid, duration, track mbid
 *   2. MusicBrainz release-group search → release-group ID for album linking
 *
 * Step 2 uses the album title from step 1 to find the correct release-group.
 * This is more reliable than recording search for popular songs with many versions.
 */
async function fetchTrackInfoBatch(
  tracks: { name: string; artist: string }[],
): Promise<Map<string, TrackInfo>> {
  const infoMap = new Map<string, TrackInfo>();
  if (tracks.length === 0) return infoMap;

  const limited = tracks.slice(0, 15);

  // ── Step 1: Last.fm track.getInfo (parallel, no rate limit) ──
  const lfmPromises = limited.map(async (track) => {
    const key = `${track.artist}:${track.name}`;
    try {
      const url = buildLastFmUrl({
        method: "track.getInfo",
        artist: track.artist,
        track: track.name,
      });

      const fetchInit: any = {};
      if (process.env.NODE_ENV !== "test") {
        fetchInit.next = { revalidate: 1800 };
      }

      const res = await fetchWithTimeout(url, fetchInit, 3000);
      if (!res.ok) return;

      const data = await res.json();
      const t = data?.track;
      if (!t) return;

      infoMap.set(key, {
        trackMbid: t.mbid || undefined,
        duration: t.duration ? parseInt(t.duration, 10) : undefined,
        albumTitle: t.album?.title,
        albumMbid: undefined, // Resolved in step 2
        artistMbid: t.artist?.mbid || undefined,
      });
    } catch {
      // Silently fail — enrichment is optional
    }
  });

  await Promise.all(lfmPromises);

  // ── Step 2: Resolve release-group IDs via MusicBrainz ──
  // Collect unique artist+album pairs that need resolution
  const albumLookups = new Map<
    string,
    { artist: string; album: string; keys: string[] }
  >();
  for (const [key, info] of infoMap) {
    if (!info.albumTitle) continue;
    const artist = key.split(":")[0];
    const lookupKey = `${normalizeText(artist)}::${normalizeText(info.albumTitle)}`;
    const existing = albumLookups.get(lookupKey);
    if (existing) {
      existing.keys.push(key);
    } else {
      albumLookups.set(lookupKey, {
        artist,
        album: info.albumTitle,
        keys: [key],
      });
    }
  }

  if (albumLookups.size > 0) {
    const rgMap = await resolveReleaseGroupIds(
      Array.from(albumLookups.values()).map((v) => ({
        artist: v.artist,
        album: v.album,
      })),
    );

    // Apply resolved release-group IDs back to track info
    for (const [, lookup] of albumLookups) {
      const resolved = rgMap.get(
        `${normalizeText(lookup.artist)}::${normalizeText(lookup.album)}`,
      );
      if (!resolved) continue;
      for (const key of lookup.keys) {
        const info = infoMap.get(key);
        if (info) {
          info.albumMbid = resolved.id;
          info.albumTitle = resolved.title;
        }
      }
    }
  }

  return infoMap;
}

/**
 * Strip common edition/remaster suffixes from album titles so we can
 * fall back to the base album name when Last.fm returns a variant.
 * e.g. "Thriller 25 Super Deluxe Edition" → "Thriller"
 */
function simplifyAlbumTitle(title: string): string {
  return title
    .replace(
      /\s*[\(\[:]?\s*(super\s+)?deluxe\s*(edition|version)?\s*[\)\]]?\s*$/i,
      "",
    )
    .replace(/\s*[\(\[:]?\s*remaster(ed)?\s*(\d{4})?\s*[\)\]]?\s*$/i, "")
    .replace(
      /\s*[\(\[:]?\s*\d+th\s+anniversary\s*(edition|version)?\s*[\)\]]?\s*$/i,
      "",
    )
    .replace(/\s*[\(\[:]?\s*expanded\s*(edition|version)?\s*[\)\]]?\s*$/i, "")
    .replace(/\s*[\(\[:]?\s*special\s*(edition|version)?\s*[\)\]]?\s*$/i, "")
    .replace(
      /\s*[\(\[:]?\s*bonus\s+track(s)?\s*(edition|version)?\s*[\)\]]?\s*$/i,
      "",
    )
    .replace(/\s*\d+\s*$/, "") // Trailing numbers like "Thriller 25"
    .trim();
}

/**
 * Resolve release-group IDs from MusicBrainz for artist+album pairs.
 * Returns a map of "normalizedArtist::normalizedAlbum" → { id, title }.
 */
async function resolveReleaseGroupIds(
  albums: { artist: string; album: string }[],
): Promise<Map<string, { id: string; title: string }>> {
  const rgMap = new Map<string, { id: string; title: string }>();
  if (albums.length === 0) return rgMap;

  // Limit lookups to keep search fast
  const limited = albums.slice(0, 10);

  const mbFetchInit: any = {
    headers: {
      "User-Agent": MB_USER_AGENT,
      Accept: "application/json",
    },
  };
  if (process.env.NODE_ENV !== "test") {
    mbFetchInit.next = { revalidate: 3600 };
  }

  // MusicBrainz rate-limits at ~1 req/sec. Process in small batches.
  const BATCH_SIZE = 3;
  const BATCH_DELAY_MS = 400;

  for (let i = 0; i < limited.length; i += BATCH_SIZE) {
    if (i > 0) {
      await new Promise((r) => setTimeout(r, BATCH_DELAY_MS));
    }

    const batch = limited.slice(i, i + BATCH_SIZE);
    const batchPromises = batch.map(async ({ artist, album }) => {
      const mapKey = `${normalizeText(artist)}::${normalizeText(album)}`;

      try {
        // Check cache first
        const cacheKey = `rg-resolve:${mapKey}`;
        const cached = searchCache.get(cacheKey);
        if (cached) {
          rgMap.set(mapKey, cached as { id: string; title: string });
          return;
        }

        // Try exact album title first, then simplified (strip deluxe/remaster suffixes)
        const albumVariants = [album];
        const simplified = simplifyAlbumTitle(album);
        if (simplified !== album) albumVariants.push(simplified);

        for (const albumVariant of albumVariants) {
          const query = `releasegroup:"${escapeMBValue(albumVariant)}" AND artist:"${escapeMBValue(artist)}"`;
          const url = `${MB_BASE_URL}/release-group?query=${encodeURIComponent(query)}&limit=10&fmt=json`;

          const res = await fetchWithTimeout(url, mbFetchInit, 4000);
          if (!res.ok) continue;

          const data = await res.json();
          const rgs = data["release-groups"];
          if (!Array.isArray(rgs) || rgs.length === 0) continue;

          const normArtist = normalizeText(artist);
          const match = pickBestReleaseGroup(
            rgs,
            normalizeText(albumVariant),
            normArtist,
          );

          if (match) {
            const result = { id: match.id, title: match.title };
            rgMap.set(mapKey, result);
            searchCache.set(cacheKey, result, 86400);
            break; // Found a match, stop trying variants
          }
        }
      } catch {
        // Silently fail — linking is optional
      }
    });

    await Promise.all(batchPromises);
  }

  return rgMap;
}

/**
 * Pick the best release-group from MusicBrainz search results.
 * Priority: exact title match > fuzzy match, then Album > EP > Single,
 * and prefer releases without secondary types (Compilation, Live, etc.).
 */
function pickBestReleaseGroup(
  rgs: any[],
  normAlbum: string,
  normArtist: string,
): { id: string; title: string } | undefined {
  const SECONDARY_DEPRIORITIZE = new Set([
    "Compilation",
    "Soundtrack",
    "Live",
    "Remix",
    "DJ-mix",
    "Mixtape/Street",
  ]);

  const ALLOWED_PRIMARY = new Set(["Album", "EP", "Single"]);

  const scoredRGs = rgs
    .filter((rg: any) => {
      if (!rg.id) return false;
      if (!ALLOWED_PRIMARY.has(rg["primary-type"])) return false;
      // Check artist match
      const rgArtist =
        rg["artist-credit"]?.[0]?.name ||
        rg["artist-credit"]?.[0]?.artist?.name ||
        "";
      if (normalizeText(rgArtist) !== normArtist) return false;
      return true;
    })
    .map((rg: any) => {
      const primary = rg["primary-type"];
      const secondary: string[] = rg["secondary-types"] || [];
      const isMain = !secondary.some((t: string) =>
        SECONDARY_DEPRIORITIZE.has(t),
      );
      const titleMatch = normalizeText(rg.title) === normAlbum;

      // Score: lower is better
      let score = 0;
      // Exact title match is strongly preferred
      if (!titleMatch) score += 100;
      // Type priority
      if (primary === "Album" && isMain) score += 0;
      else if (primary === "EP" && isMain) score += 1;
      else if (primary === "Album") score += 2;
      else if (primary === "EP") score += 3;
      else if (primary === "Single" && isMain) score += 4;
      else if (primary === "Single") score += 5;
      else score += 6;

      return { id: rg.id, title: rg.title, score };
    })
    .sort((a: any, b: any) => a.score - b.score);

  return scoredRGs.length > 0 ? scoredRGs[0] : undefined;
}

/**
 * Escape special characters in MusicBrainz Lucene query values.
 */
function escapeMBValue(input: string): string {
  return input.replace(/([+\-&|!(){}[\]^"~*?:\\/])/g, "\\$1");
}

// ─── Main Export ───────────────────────────────────────────────────────────────

export async function searchByCategory(
  query: string,
  category: Exclude<SearchCategory, "all">,
): Promise<SearchResult[]> {
  switch (category) {
    case "artist":
      return searchArtists(query);
    case "album":
      return searchAlbums(query);
    case "song":
      return searchSongs(query);
    default:
      return [];
  }
}

export async function searchAll(query: string): Promise<GroupedSearchResults> {
  // Fire all three searches in parallel — Last.fm has no rate limit concerns
  const [artists, albums, songs] = await Promise.all([
    searchArtists(query, FETCH_LIMITS.all.artists, true),
    searchAlbums(query, FETCH_LIMITS.all.albums, true),
    searchSongs(query, FETCH_LIMITS.all.songs, true),
  ]);

  return { artists, albums, songs };
}

export async function searchMusicBrainz(
  query: string,
  category: SearchCategory = "all",
): Promise<{ results: SearchResult[]; grouped?: GroupedSearchResults }> {
  if (!isValidQuery(query)) {
    return { results: [] };
  }

  const trimmed = query.trim();

  if (category === "all") {
    const grouped = await searchAll(trimmed);
    const flat: SearchResult[] = [
      ...grouped.artists.slice(0, RETURN_LIMITS.allArtists),
      ...grouped.albums.slice(0, RETURN_LIMITS.allAlbums),
      ...grouped.songs.slice(0, RETURN_LIMITS.allSongs),
    ];
    return { results: flat, grouped };
  }

  const results = await searchByCategory(trimmed, category);
  return { results };
}
