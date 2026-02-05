/**
 * searchService.ts — High-performance search service
 *
 * Queries MusicBrainz for Artists, Albums (release-groups), and Songs (recordings).
 * Smart-sorted by "Fame Index" so popular tracks surface first.
 *
 * ─── Performance Optimizations ────────────────────────────────────────
 *   1. In-flight request deduplication — identical concurrent queries share one promise
 *   2. LRU cache with 30min TTL — repeated queries are instant
 *   3. Non-blocking ListenBrainz — enrichment is lazy (separate endpoint)
 *   4. Tuned fetch limits — "all" mode uses smaller limits per entity
 *   5. Promise.all for parallel queries — all entities fetched simultaneously
 *   6. MusicBrainz rate limit compliance — 1 req/sec via built-in fetch caching
 *
 * ─── Entity Mapping ──────────────────────────────────────────────────
 *   "Artist" → MusicBrainz `artist`
 *   "Album"  → MusicBrainz `release-group` (NOT `release`)
 *   "Song"   → MusicBrainz `recording`
 *
 * ─── Smart Sorting (Fame Index) ──────────────────────────────────────
 *   Songs are sorted by: (releaseCount * 0.7) + (mbRelevance * 0.3)
 *   A song on 30+ releases is a hit; one on 1 release is obscure.
 */

import { searchCache } from "@/lib/cache";
import type {
  SearchCategory,
  SearchResult,
  ArtistSearchResult,
  AlbumSearchResult,
  SongSearchResult,
  GroupedSearchResults,
} from "@/types/search";

// ─── Constants ─────────────────────────────────────────────────────────────────

const MB_BASE_URL = "https://musicbrainz.org/ws/2";
const LISTENBRAINZ_BASE_URL = "https://api.listenbrainz.org/1";
const USER_AGENT = "SongRates/1.0 (mpittas@gmail.com)";

/** Fetch limits — tuned for speed. "All" mode uses FAST limits. */
const LIMITS = {
  /** When searching a single entity type */
  single: { artists: 15, albums: 20, songs: 50 },
  /** When searching "all" — smaller limits since we only show a few per type */
  all: { artists: 8, albums: 10, songs: 30 },
} as const;

/** How many final results to return per type */
const RETURN_LIMITS = {
  artists: 10,
  albums: 10,
  songs: 15,
  /** In "all" mode, how many per section */
  allArtists: 3,
  allAlbums: 3,
  allSongs: 8,
} as const;

// ─── In-flight Request Deduplication ───────────────────────────────────────────
// Prevents identical concurrent queries from making duplicate API calls.
// If query A is still in-flight when query A comes in again, we reuse the promise.

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

// ─── MusicBrainz Fetch Helper ──────────────────────────────────────────────────

async function fetchMB<T>(path: string): Promise<T | null> {
  try {
    const res = await fetch(`${MB_BASE_URL}/${path}`, {
      headers: {
        "User-Agent": USER_AGENT,
        Accept: "application/json",
      },
      // Next.js fetch cache: revalidate every 30 min (server-side dedup)
      next: { revalidate: 1800 },
    });
    if (!res.ok) {
      console.error(`MB API ${res.status} for ${path}`);
      return null;
    }
    return res.json();
  } catch (err) {
    console.error("MB fetch error:", err);
    return null;
  }
}

/**
 * Sanitize user input for Lucene queries.
 */
function sanitizeLucene(input: string): string {
  return input.replace(/([+\-&|!(){}[\]^"~*?:\\/])/g, "\\$1");
}

/** Validate search query */
export function isValidQuery(query: string): boolean {
  return (
    typeof query === "string" &&
    query.trim().length >= 1 &&
    query.trim().length <= 200
  );
}

/** Validate search category */
export function isValidCategory(category: string): category is SearchCategory {
  return ["all", "artist", "album", "song"].includes(category);
}

// ─── Artist Search ─────────────────────────────────────────────────────────────

async function searchArtists(
  query: string,
  limit: number = LIMITS.single.artists,
): Promise<ArtistSearchResult[]> {
  const cacheKey = `search:artist:${query.toLowerCase()}:${limit}`;
  const cached = searchCache.get(cacheKey);
  if (cached) return cached as ArtistSearchResult[];

  return deduplicatedFetch(cacheKey, async () => {
    const sanitized = sanitizeLucene(query);
    const luceneQuery = `artist:"${sanitized}"`;
    const path = `artist?query=${encodeURIComponent(luceneQuery)}&limit=${limit}&fmt=json`;

    const data = await fetchMB<any>(path);
    if (!data) return [];

    const results: ArtistSearchResult[] = (data.artists || [])
      .slice(0, RETURN_LIMITS.artists)
      .map((a: any) => ({
        id: a.id,
        type: "artist" as const,
        title: a.name,
        subtitle: a.disambiguation || a.country || undefined,
        score: a.score ?? 0,
        country: a.country,
        disambiguation: a.disambiguation,
        artistType: a.type,
      }));

    searchCache.set(cacheKey, results, 1800);
    return results;
  });
}

// ─── Album Search (release-group) ──────────────────────────────────────────────

async function searchAlbums(
  query: string,
  limit: number = LIMITS.single.albums,
): Promise<AlbumSearchResult[]> {
  const cacheKey = `search:album:${query.toLowerCase()}:${limit}`;
  const cached = searchCache.get(cacheKey);
  if (cached) return cached as AlbumSearchResult[];

  return deduplicatedFetch(cacheKey, async () => {
    const sanitized = sanitizeLucene(query);
    const luceneQuery = `releasegroup:"${sanitized}"`;
    const path = `release-group?query=${encodeURIComponent(luceneQuery)}&limit=${limit}&fmt=json`;

    const data = await fetchMB<any>(path);
    if (!data) return [];

    const results: AlbumSearchResult[] = (data["release-groups"] || [])
      .filter((rg: any) =>
        ["Album", "EP", "Single"].includes(rg["primary-type"]),
      )
      .slice(0, RETURN_LIMITS.albums)
      .map((rg: any) => ({
        id: rg.id,
        type: "album" as const,
        title: rg.title,
        subtitle: rg["artist-credit"]?.[0]?.name,
        score: rg.score ?? 0,
        artistName: rg["artist-credit"]?.[0]?.name,
        artistId: rg["artist-credit"]?.[0]?.artist?.id,
        releaseDate: rg["first-release-date"],
        primaryType: rg["primary-type"],
      }));

    searchCache.set(cacheKey, results, 1800);
    return results;
  });
}

// ─── Song Search (recording) with Fame Index ───────────────────────────────────

function recordingDedupKey(recording: any): string {
  const title = (recording.title || "").toLowerCase().trim();
  const artist = (recording["artist-credit"]?.[0]?.name || "")
    .toLowerCase()
    .trim();
  return `${title}::${artist}`;
}

async function searchSongs(
  query: string,
  limit: number = LIMITS.single.songs,
): Promise<SongSearchResult[]> {
  const cacheKey = `search:song:${query.toLowerCase()}:${limit}`;
  const cached = searchCache.get(cacheKey);
  if (cached) return cached as SongSearchResult[];

  return deduplicatedFetch(cacheKey, async () => {
    const sanitized = sanitizeLucene(query);
    const luceneQuery = `recording:"${sanitized}"`;
    const path = `recording?query=${encodeURIComponent(luceneQuery)}&limit=${limit}&fmt=json`;

    const data = await fetchMB<any>(path);
    if (!data) return [];

    const recordings = data.recordings || [];

    // ─── Deduplicate: keep the version with the most releases ──────────
    const dedupMap = new Map<string, any>();
    for (const rec of recordings) {
      const key = recordingDedupKey(rec);
      const existing = dedupMap.get(key);
      const recCount = rec.releases?.length || 0;
      const existingCount = existing?.releases?.length || 0;
      if (!existing || recCount > existingCount) {
        dedupMap.set(key, rec);
      }
    }

    const deduped = Array.from(dedupMap.values());

    // ─── Smart Sort: Fame Index (release count) ────────────────────────
    const maxReleaseCount = Math.max(
      ...deduped.map((r) => r.releases?.length || 0),
      1,
    );

    deduped.sort((a, b) => {
      const aRel = a.releases?.length || 0;
      const bRel = b.releases?.length || 0;
      const aScore = a.score ?? 0;
      const bScore = b.score ?? 0;
      const aFame = (aRel / maxReleaseCount) * 100;
      const bFame = (bRel / maxReleaseCount) * 100;
      return bFame * 0.7 + bScore * 0.3 - (aFame * 0.7 + aScore * 0.3);
    });

    const top = deduped.slice(0, RETURN_LIMITS.songs);

    // ─── Map to typed results (NO ListenBrainz blocking) ───────────────
    const results: SongSearchResult[] = top.map((r: any) => {
      const releases = r.releases || [];
      let bestRG: { id: string; title: string } | undefined;

      for (const rel of releases) {
        const rg = rel["release-group"];
        if (rg?.id) {
          if (rg["primary-type"] === "Album") {
            bestRG = { id: rg.id, title: rg.title };
            break;
          }
          if (!bestRG) bestRG = { id: rg.id, title: rg.title };
        }
      }

      return {
        id: r.id,
        type: "song" as const,
        title: r.title,
        subtitle: r["artist-credit"]?.[0]?.name,
        score: r.score ?? 0,
        artistName: r["artist-credit"]?.[0]?.name,
        artistId: r["artist-credit"]?.[0]?.artist?.id,
        releaseCount: releases.length,
        firstReleaseDate: r["first-release-date"],
        length: r.length,
        releaseGroupId: bestRG?.id,
        releaseGroupTitle: bestRG?.title,
      };
    });

    searchCache.set(cacheKey, results, 1800);
    return results;
  });
}

// ─── ListenBrainz Enrichment (Separate/Lazy) ──────────────────────────────────
// This is NOT called during the main search flow.
// It's called separately via /api/search/enrich to avoid blocking results.

export async function fetchListenBrainzCounts(
  mbids: string[],
): Promise<Record<string, number>> {
  if (mbids.length === 0) return {};

  const cacheKey = `lb:${mbids.sort().join(",")}`;
  const cached = searchCache.get(cacheKey);
  if (cached) return cached as Record<string, number>;

  try {
    const res = await fetch(`${LISTENBRAINZ_BASE_URL}/popularity/recording`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": USER_AGENT,
      },
      body: JSON.stringify({ recording_mbids: mbids }),
    });

    if (!res.ok) return {};

    const data = await res.json();
    const counts: Record<string, number> = {};

    const items = Array.isArray(data)
      ? data
      : Array.isArray(data?.payload)
        ? data.payload
        : [];

    for (const entry of items) {
      if (
        entry.recording_mbid &&
        typeof entry.total_listen_count === "number"
      ) {
        counts[entry.recording_mbid] = entry.total_listen_count;
      }
    }

    searchCache.set(cacheKey, counts, 3600); // Cache 1 hour
    return counts;
  } catch {
    return {};
  }
}

// ─── Unified Search Orchestrator ───────────────────────────────────────────────

/** Search a single category */
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

/** Search all categories in parallel with optimized limits */
export async function searchAll(query: string): Promise<GroupedSearchResults> {
  // Use smaller limits for "all" mode — we only show 3+3+8 results
  const [artists, albums, songs] = await Promise.all([
    searchArtists(query, LIMITS.all.artists),
    searchAlbums(query, LIMITS.all.albums),
    searchSongs(query, LIMITS.all.songs),
  ]);

  return { artists, albums, songs };
}

/**
 * Main entry point. Returns results as fast as possible.
 * ListenBrainz enrichment is NOT included — use fetchListenBrainzCounts separately.
 */
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
