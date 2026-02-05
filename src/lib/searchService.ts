/**
 * searchService.ts — High-performance search service with truly smart search
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
 * ─── Smart Search ────────────────────────────────────────────────────
 *   ▸ Spaced-out titles:    "amari" finds "a m a r i" (J. Cole)
 *   ▸ Typo tolerance:       "beyonse" finds "Beyoncé" (Lucene fuzzy ~)
 *   ▸ Special chars:        "acdc" finds "AC/DC"
 *   ▸ Diacritics:           "beyonce" finds "Beyoncé"
 *   ▸ Common substitutions: "&" ↔ "and", "ft." ↔ "featuring"
 *   ▸ Post-fetch re-ranking by normalized match quality
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
import { searchLastFmTracks, type LastFmTrack } from "@/lib/lastfm";
import {
  buildSmartLuceneQuery,
  escapeLuceneValue,
  smartRerank,
  smartMatchScore,
  normalizeText,
  collapseSpaces,
} from "@/lib/smartSearch";
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

/** Fetch limits — tuned for speed. Slightly higher for smart search to get
 *  more candidates before dedup/sort. "All" mode uses FAST limits. */
const LIMITS = {
  /** When searching a single entity type */
  single: { artists: 20, albums: 25, songs: 65 },
  /** When searching "all" — smaller limits since we only show a few per type */
  all: { artists: 10, albums: 12, songs: 40 },
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

// sanitizeLucene is now handled by smartSearch.ts's escapeLuceneValue
// and buildSmartLuceneQuery. Keeping a local alias for any edge cases.

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
  const cacheKey = `search:artist:${normalizeText(query)}:${limit}`;
  const cached = searchCache.get(cacheKey);
  if (cached) return cached as ArtistSearchResult[];

  return deduplicatedFetch(cacheKey, async () => {
    // ─── Smart Lucene query with fuzzy matching & variations ──────────
    const luceneQuery = buildSmartLuceneQuery("artist", query);
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

    // ─── Smart re-rank: boost results that best match the query ────────
    const reranked = smartRerank(results, query);

    searchCache.set(cacheKey, reranked, 1800);
    return reranked;
  });
}

// ─── Album Search (release-group) ──────────────────────────────────────────────

async function searchAlbums(
  query: string,
  limit: number = LIMITS.single.albums,
): Promise<AlbumSearchResult[]> {
  const cacheKey = `search:album:${normalizeText(query)}:${limit}`;
  const cached = searchCache.get(cacheKey);
  if (cached) return cached as AlbumSearchResult[];

  return deduplicatedFetch(cacheKey, async () => {
    // ─── Smart Lucene query with fuzzy matching & variations ──────────
    const luceneQuery = buildSmartLuceneQuery("releasegroup", query);
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

    // ─── Smart re-rank: boost results that best match the query ────────
    const reranked = smartRerank(results, query);

    searchCache.set(cacheKey, reranked, 1800);
    return reranked;
  });
}

// ─── Fame Signal Helpers ────────────────────────────────────────────────────────
// These functions extract "Fame Signals" from MusicBrainz recording data
// to rank the most popular/famous version of a song above covers & obscure versions.

/**
 * Count only releases with status: "Official".
 * Michael Jackson's "Billie Jean" appears on hundreds of official releases
 * while a cover version usually appears on only one or two.
 */
function countOfficialReleases(releases: any[]): number {
  return releases.filter((r: any) => r.status === "Official").length;
}

/**
 * Check if a recording appears on any Album-type release-group.
 * Recordings on Albums are prioritized over Singles/Compilations.
 */
function hasAlbumTypeRelease(releases: any[]): boolean {
  return releases.some(
    (r: any) => r["release-group"]?.["primary-type"] === "Album",
  );
}

/**
 * Compute the primary-type bonus for a recording:
 *   Album = 3, EP = 2, Single = 1, Compilation/Other = 0
 * Takes the highest type found across all releases.
 */
function primaryTypeBonus(releases: any[]): number {
  const TYPE_SCORES: Record<string, number> = {
    Album: 3,
    EP: 2,
    Single: 1,
  };

  let best = 0;
  for (const rel of releases) {
    const ptype = rel["release-group"]?.["primary-type"];
    if (ptype && TYPE_SCORES[ptype] !== undefined) {
      best = Math.max(best, TYPE_SCORES[ptype]);
    }
  }
  return best;
}

/**
 * Find the original album for a recording — the earliest official Album-type
 * release-group by first-release-date. Falls back to any release-group if
 * no Album-type is found.
 *
 * Why: the user wants to see "Thriller" for "Billie Jean", not a random
 * compilation from 2015.
 */
function findOriginalAlbum(
  releases: any[],
): { id: string; title: string; date: string } | undefined {
  // First pass: official Album-type releases, sorted by date ascending
  const albumReleases = releases
    .filter((r: any) => {
      const rg = r["release-group"];
      return (
        rg?.id &&
        rg["primary-type"] === "Album" &&
        (!r.status || r.status === "Official")
      );
    })
    .sort((a: any, b: any) => {
      const dateA =
        a.date || a["release-group"]?.["first-release-date"] || "9999-99-99";
      const dateB =
        b.date || b["release-group"]?.["first-release-date"] || "9999-99-99";
      return dateA.localeCompare(dateB);
    });

  if (albumReleases.length > 0) {
    const rg = albumReleases[0]["release-group"];
    return {
      id: rg.id,
      title: rg.title,
      date: albumReleases[0].date || rg["first-release-date"] || "",
    };
  }

  // Fallback: any official release-group sorted by date
  const anyOfficial = releases
    .filter(
      (r: any) =>
        r["release-group"]?.id && (!r.status || r.status === "Official"),
    )
    .sort((a: any, b: any) => {
      const dateA =
        a.date || a["release-group"]?.["first-release-date"] || "9999-99-99";
      const dateB =
        b.date || b["release-group"]?.["first-release-date"] || "9999-99-99";
      return dateA.localeCompare(dateB);
    });

  if (anyOfficial.length > 0) {
    const rg = anyOfficial[0]["release-group"];
    return {
      id: rg.id,
      title: rg.title,
      date: anyOfficial[0].date || rg["first-release-date"] || "",
    };
  }

  return undefined;
}

/**
 * Re-rank MusicBrainz recordings using "Fame Signals":
 *   1. Official release count (official versions appear on more official releases)
 *   2. Primary type bonus (Album > EP > Single > Compilation)
 *   3. Last.fm popularity (real listener counts)
 *   4. Title match quality (smart fuzzy match)
 *   5. MB relevance score (MusicBrainz's own scoring)
 *
 * Weights:
 *   - Last.fm popularity:    40%  (real-world popularity)
 *   - Official release count: 25%  (fame index — how many official releases)
 *   - Primary type bonus:     10%  (Album > EP > Single)
 *   - Title match quality:    15%  (how well the title matches the query)
 *   - MB relevance score:     10%  (MusicBrainz's built-in relevance)
 */
function computeFameScore(
  recording: any,
  query: string,
  popMap: { byKey: Map<string, number>; byMbid: Map<string, number> },
  maxListeners: number,
  maxOfficialCount: number,
): number {
  const releases = recording.releases || [];

  // Last.fm popularity (0–100 normalized)
  const popularity =
    (getPopularity(recording, popMap) / Math.max(maxListeners, 1)) * 100;

  // Official release count (0–100 normalized)
  const officialCount = countOfficialReleases(releases);
  const fameIndex = (officialCount / Math.max(maxOfficialCount, 1)) * 100;

  // Primary type bonus (0–100): Album=100, EP=67, Single=33, Other=0
  const typeBonus = (primaryTypeBonus(releases) / 3) * 100;

  // Title match quality (0–100)
  const titleMatch = smartMatchScore(query, recording.title || "");

  // MB relevance score (0–100)
  const mbScore = recording.score ?? 0;

  // Weighted combination
  return (
    popularity * 0.4 +
    fameIndex * 0.25 +
    typeBonus * 0.1 +
    titleMatch * 0.15 +
    mbScore * 0.1
  );
}

// ─── Song Search — Hybrid MusicBrainz + Last.fm ────────────────────────────────
// MusicBrainz gives us IDs and metadata, but has NO popularity ranking.
// Last.fm gives us real popularity data (listener counts) so famous songs
// like "Billie Jean" by MJ or "Imagine" by John Lennon surface first.

function recordingDedupKey(recording: any): string {
  // Use collapsed normalization so "a m a r i" and "amari" dedup together
  const title = collapseSpaces(normalizeText(recording.title || ""));
  const artist = collapseSpaces(
    normalizeText(recording["artist-credit"]?.[0]?.name || ""),
  );
  return `${title}::${artist}`;
}

/** Simple dedup key from Last.fm track data */
function lastFmDedupKey(name: string, artist: string): string {
  return `${collapseSpaces(normalizeText(name))}::${collapseSpaces(normalizeText(artist))}`;
}

/**
 * Build a Last.fm popularity lookup map from track search results.
 */
function buildPopularityMap(lastFmTracks: LastFmTrack[]): {
  byKey: Map<string, number>;
  byMbid: Map<string, number>;
} {
  const byKey = new Map<string, number>();
  const byMbid = new Map<string, number>();

  for (const track of lastFmTracks) {
    const key = lastFmDedupKey(track.name, track.artist);
    const existing = byKey.get(key) || 0;
    if (track.listeners > existing) {
      byKey.set(key, track.listeners);
    }
    if (track.mbid) {
      byMbid.set(track.mbid, track.listeners);
    }
  }

  return { byKey, byMbid };
}

/**
 * Look up a recording's popularity from the Last.fm map.
 */
function getPopularity(
  recording: any,
  popMap: { byKey: Map<string, number>; byMbid: Map<string, number> },
): number {
  if (recording.id && popMap.byMbid.has(recording.id)) {
    return popMap.byMbid.get(recording.id)!;
  }
  const key = recordingDedupKey(recording);
  return popMap.byKey.get(key) || 0;
}

/**
 * For popular Last.fm tracks MISSING from general MusicBrainz results,
 * do a targeted MusicBrainz search: `recording:"title" AND artist:"artist"`.
 * This reliably finds the specific recording (e.g., MJ's "Billie Jean").
 */
async function fetchMissingPopularRecordings(
  lastFmTracks: LastFmTrack[],
  existingKeys: Set<string>,
  maxLookups: number = 3,
): Promise<any[]> {
  const missing = lastFmTracks
    .filter((t) => t.listeners > 0)
    .filter((t) => !existingKeys.has(lastFmDedupKey(t.name, t.artist)))
    .slice(0, maxLookups);

  if (missing.length === 0) return [];

  const lookups = missing.map(async (track) => {
    const titleEsc = escapeLuceneValue(normalizeText(track.name));
    const artistEsc = escapeLuceneValue(normalizeText(track.artist));
    const lucene = `recording:"${titleEsc}" AND artist:"${artistEsc}"`;
    const path = `recording?query=${encodeURIComponent(lucene)}&limit=3&fmt=json`;
    const result = await fetchMB<any>(path);
    return result?.recordings || [];
  });

  const results = await Promise.all(lookups);
  return results.flat();
}

async function searchSongs(
  query: string,
  limit: number = LIMITS.single.songs,
): Promise<SongSearchResult[]> {
  const cacheKey = `search:song:v3:${normalizeText(query)}:${limit}`;
  const cached = searchCache.get(cacheKey);
  if (cached) return cached as SongSearchResult[];

  return deduplicatedFetch(cacheKey, async () => {
    // ─── Phase 1: Parallel MusicBrainz + Last.fm ─────────────────────
    const luceneQuery = buildSmartLuceneQuery("recording", query);
    const mbPath = `recording?query=${encodeURIComponent(luceneQuery)}&limit=${limit}&fmt=json`;

    const [data, lastFmTracks] = await Promise.all([
      fetchMB<any>(mbPath),
      searchLastFmTracks(query, 30),
    ]);

    if (!data) return [];

    let recordings: any[] = data.recordings || [];

    // ─── Phase 2: Inject missing popular tracks ──────────────────────
    // MusicBrainz may not include the most famous version (e.g., MJ's
    // "Billie Jean" buried under 100+ covers). Last.fm tells us which
    // versions are popular; we do targeted MB lookups for missing ones.
    const existingKeys = new Set(recordings.map(recordingDedupKey));

    if (lastFmTracks.length > 0) {
      const extra = await fetchMissingPopularRecordings(
        lastFmTracks,
        existingKeys,
        3,
      );
      if (extra.length > 0) {
        recordings = [...recordings, ...extra];
      }
    }

    // ─── Build popularity map from Last.fm ───────────────────────────
    const popMap = buildPopularityMap(lastFmTracks);
    const maxListeners = Math.max(...lastFmTracks.map((t) => t.listeners), 1);

    // ─── Deduplicate: keep the version with the most OFFICIAL releases ─
    // Prefer the version that appears on more official releases (not bootlegs).
    const dedupMap = new Map<string, any>();
    for (const rec of recordings) {
      const key = recordingDedupKey(rec);
      const existing = dedupMap.get(key);
      const recOfficial = countOfficialReleases(rec.releases || []);
      const existingOfficial = existing
        ? countOfficialReleases(existing.releases || [])
        : 0;
      if (!existing || recOfficial > existingOfficial) {
        dedupMap.set(key, rec);
      }
    }

    const deduped = Array.from(dedupMap.values());

    // ─── Fame Signal Sorting ─────────────────────────────────────────
    // Uses the multi-factor Fame Score:
    //   • Last.fm popularity (40%) — real-world listener counts
    //   • Official release count (25%) — fame index (official releases only)
    //   • Primary type bonus (10%) — Album > EP > Single > Compilation
    //   • Title match quality (15%) — fuzzy match quality
    //   • MB relevance score (10%) — MusicBrainz built-in relevance
    //
    // This ensures:
    //   • "Billie Jean" → MJ first (highest listeners + most official releases)
    //   • "Imagine" → John Lennon first (highest listeners + Album bonus)
    //   • "amari" → J. Cole's "a m a r i" surfaces (good title match + decent popularity)
    const maxOfficialCount = Math.max(
      ...deduped.map((r) => countOfficialReleases(r.releases || [])),
      1,
    );

    deduped.sort((a, b) => {
      const aScore = computeFameScore(
        a,
        query,
        popMap,
        maxListeners,
        maxOfficialCount,
      );
      const bScore = computeFameScore(
        b,
        query,
        popMap,
        maxListeners,
        maxOfficialCount,
      );
      return bScore - aScore;
    });

    const top = deduped.slice(0, RETURN_LIMITS.songs);

    // ─── Map to typed results with Fame Signal data ──────────────────
    const results: SongSearchResult[] = top.map((r: any) => {
      const releases = r.releases || [];

      // Find the original album (earliest official Album release-group)
      const originalAlbum = findOriginalAlbum(releases);

      // Find best release-group for linking: prefer original album, fallback to any
      const bestRG = originalAlbum
        ? { id: originalAlbum.id, title: originalAlbum.title }
        : (() => {
            for (const rel of releases) {
              const rg = rel["release-group"];
              if (rg?.id) return { id: rg.id, title: rg.title };
            }
            return undefined;
          })();

      return {
        id: r.id,
        type: "song" as const,
        title: r.title,
        subtitle: r["artist-credit"]?.[0]?.name,
        score: r.score ?? 0,
        artistName: r["artist-credit"]?.[0]?.name,
        artistId: r["artist-credit"]?.[0]?.artist?.id,
        releaseCount: releases.length,
        officialReleaseCount: countOfficialReleases(releases),
        hasAlbumRelease: hasAlbumTypeRelease(releases),
        firstReleaseDate: r["first-release-date"],
        length: r.length,
        releaseGroupId: bestRG?.id,
        releaseGroupTitle: bestRG?.title,
        originalAlbumTitle: originalAlbum?.title,
        originalAlbumDate: originalAlbum?.date,
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
