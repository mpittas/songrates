/**
 * searchService.ts — Hybrid Smart Search
 *
 * Combines MusicBrainz (structural metadata) with Last.fm (popularity ranking)
 * to surface the truly "famous" songs first.
 */

import { searchCache } from "@/lib/cache";
import {
  buildSmartLuceneQuery,
  smartRerank,
  normalizeText,
  collapseSpaces,
  escapeLuceneValue,
} from "@/lib/smartSearch";
import { searchLastFmTracks } from "@/lib/lastfm"; // New import
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
const USER_AGENT = "SongRates/1.0 (mpittas@gmail.com)";

/** Fetch limits */
const LIMITS = {
  single: { artists: 20, albums: 25, songs: 60 }, // MB limit lowered for songs as we rely on ranking
  all: { artists: 10, albums: 12, songs: 25 },
} as const;

/** How many final results to return per type */
const RETURN_LIMITS = {
  artists: 10,
  albums: 10,
  songs: 15, // Return top 15 most popular
  allArtists: 3,
  allAlbums: 3,
  allSongs: 8,
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

// ─── MusicBrainz Fetch Helper ──────────────────────────────────────────────────

async function fetchMB<T>(path: string): Promise<T | null> {
  try {
    const res = await fetch(`${MB_BASE_URL}/${path}`, {
      headers: {
        "User-Agent": USER_AGENT,
        Accept: "application/json",
      },
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

function cleanString(str: string): string {
  return collapseSpaces(normalizeText(str));
}

// ─── Artist Search (Unchanged) ─────────────────────────────────────────────────

async function searchArtists(
  query: string,
  limit: number = LIMITS.single.artists,
): Promise<ArtistSearchResult[]> {
  const cacheKey = `search:artist:${normalizeText(query)}:${limit}`;
  const cached = searchCache.get(cacheKey);
  if (cached) return cached as ArtistSearchResult[];

  return deduplicatedFetch(cacheKey, async () => {
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

    const reranked = smartRerank(results, query);
    searchCache.set(cacheKey, reranked, 1800);
    return reranked;
  });
}

// ─── Album Search (Unchanged) ──────────────────────────────────────────────────

async function searchAlbums(
  query: string,
  limit: number = LIMITS.single.albums,
): Promise<AlbumSearchResult[]> {
  const cacheKey = `search:album:${normalizeText(query)}:${limit}`;
  const cached = searchCache.get(cacheKey);
  if (cached) return cached as AlbumSearchResult[];

  return deduplicatedFetch(cacheKey, async () => {
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

    const reranked = smartRerank(results, query);
    searchCache.set(cacheKey, reranked, 1800);
    return reranked;
  });
}

// ─── Hybrid Song Search ────────────────────────────────────────────────────────
// Fetches MB candidates AND Last.fm popularity ranking in parallel.
// Merges them to ensure the most popular song (based on listeners) is top.

async function searchSongs(
  query: string,
  limit: number = LIMITS.single.songs,
): Promise<SongSearchResult[]> {
  const cacheKey = `search:song:hybrid:${normalizeText(query)}:${limit}`;
  const cached = searchCache.get(cacheKey);
  if (cached) return cached as SongSearchResult[];

  return deduplicatedFetch(cacheKey, async () => {
    // 1. Parallel Fetch: MB candidates + Last.fm popularity ranking
    // 1. Start Broad MB Fetch immediately (it's slow)
    const luceneQuery = buildSmartLuceneQuery("recording", query);
    const broadMbPromise = fetchMB<any>(
      `recording?query=${encodeURIComponent(luceneQuery)}&limit=${limit}&fmt=json`,
    );

    // 2. Fetch Last.fm to find "True Popularity" targets
    const lastFmTracks = await searchLastFmTracks(query, 50);

    // 3. Identification & Targeted Injection
    // The broad search might miss the #1 hit if it's buried (e.g. "Beat It" by MJ).
    // We explicitly fetch metadata for the Top 3 Last.fm tracks to guarantee they exist.
    const topHits = lastFmTracks.slice(0, 3);

    const targetedPromises = topHits.map(async (hit) => {
      // Build a specific query: recording:"Beat It" AND artist:"Michael Jackson"
      const targetQuery = `recording:"${escapeLuceneValue(hit.name)}" AND artist:"${escapeLuceneValue(hit.artist)}"`;
      const path = `recording?query=${encodeURIComponent(targetQuery)}&limit=10&fmt=json`; // limit 10 to capture originals amidst compilations
      return fetchMB<any>(path);
    });

    const [broadData, ...targetedResults] = await Promise.all([
      broadMbPromise,
      ...targetedPromises,
    ]);

    if (!broadData && targetedResults.length === 0) return [];

    // Merge all recordings
    const broadRecordings = broadData?.recordings || [];
    const targetedRecordings = targetedResults.flatMap(
      (r) => r?.recordings || [],
    );
    const recordings: any[] = [...broadRecordings, ...targetedRecordings];

    // 2. Build Popularity Lookup Map
    // Key: "artist:title" (normalized) -> listeners
    const popularityMap = new Map<string, number>();

    lastFmTracks.forEach((track) => {
      const key = `${cleanString(track.artist)}:${cleanString(track.name)}`;
      const existing = popularityMap.get(key) || 0;
      popularityMap.set(key, Math.max(existing, track.listeners));
    });

    // 3. Deduplicate MB results
    const dedupMap = new Map<string, any>();
    recordings.forEach((rec) => {
      const title = cleanString(rec.title || "");
      const artist = cleanString(rec["artist-credit"]?.[0]?.name || "");
      const key = `${artist}:${title}`;

      const existing = dedupMap.get(key);
      const recOfficial = countOfficialReleases(rec.releases || []);
      const existingOfficial = existing
        ? countOfficialReleases(existing.releases || [])
        : 0;

      // Prefer the recording with the EARLIEST release date (Original)
      // If dates are missing or equal, fall back to structural fame (release count)
      const recDate = rec["first-release-date"] || "9999-99-99";
      const existingDate = existing
        ? existing["first-release-date"] || "9999-99-99"
        : "9999-99-99";

      let shouldReplace = !existing;

      if (existing) {
        if (recDate < existingDate) {
          shouldReplace = true; // Older is better
        } else if (recDate === existingDate) {
          shouldReplace = recOfficial > existingOfficial; // Tie-break: more releases
        }
      }

      if (shouldReplace) {
        dedupMap.set(key, rec);
      }
    });

    const deduped = Array.from(dedupMap.values());

    // 4. Score and Sort
    const scored = deduped.map((rec) => {
      const title = cleanString(rec.title || "");
      const artist = cleanString(rec["artist-credit"]?.[0]?.name || "");
      const key = `${artist}:${title}`;

      // Get popularity from Last.fm
      const listeners = popularityMap.get(key) || 0;

      // Fallback: Use official release count as a proxy if no Last.fm data
      const officialCount = countOfficialReleases(rec.releases || []);

      // Composite Score:
      // If we have listeners, that's the dominant factor.
      // If not, we rely on release count.
      // We normalize listeners roughly (1M listeners = high score)
      const popularityScore = listeners > 0 ? listeners : officialCount * 1000; // 1 release ~= 1000 listeners fallback

      return { rec, score: popularityScore, listeners };
    });

    // Sort descending by score
    scored.sort((a, b) => b.score - a.score);

    const top = scored.slice(0, RETURN_LIMITS.songs);

    // 5. Map to Result
    const results: SongSearchResult[] = top.map(({ rec, listeners }) => {
      const releases = rec.releases || [];
      const originalAlbum = findOriginalAlbum(releases);
      const bestRG = originalAlbum ||
        releases[0]?.["release-group"] || { id: "", title: "" };

      return {
        id: rec.id,
        type: "song" as const,
        title: rec.title,
        subtitle: rec["artist-credit"]?.[0]?.name,
        score: rec.score ?? 0, // MB score
        artistName: rec["artist-credit"]?.[0]?.name,
        artistId: rec["artist-credit"]?.[0]?.artist?.id,
        releaseCount: releases.length,
        officialReleaseCount: countOfficialReleases(releases),
        hasAlbumRelease: hasAlbumTypeRelease(releases),
        firstReleaseDate: rec["first-release-date"],
        length: rec.length,
        releaseGroupId: bestRG.id,
        releaseGroupTitle: bestRG.title,
        originalAlbumTitle: originalAlbum?.title,
        originalAlbumDate: originalAlbum?.date,
        // We can pass listen count (from Last.fm) if we want to display it immediately
        listenCount: listeners > 0 ? listeners : undefined,
      };
    });

    searchCache.set(cacheKey, results, 1800);
    return results;
  });
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

function countOfficialReleases(releases: any[]): number {
  return releases.filter((r: any) => r.status === "Official").length;
}

function hasAlbumTypeRelease(releases: any[]): boolean {
  return releases.some(
    (r: any) => r["release-group"]?.["primary-type"] === "Album",
  );
}

function findOriginalAlbum(
  releases: any[],
): { id: string; title: string; date: string } | undefined {
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
      const dateA = a.date || "9999";
      const dateB = b.date || "9999";
      return dateA.localeCompare(dateB);
    });

  if (albumReleases.length > 0) {
    const rg = albumReleases[0]["release-group"];
    return {
      id: rg.id,
      title: rg.title,
      date: albumReleases[0].date || "",
    };
  }
  return undefined;
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
  const [artists, albums, songs] = await Promise.all([
    searchArtists(query, LIMITS.all.artists),
    searchAlbums(query, LIMITS.all.albums),
    searchSongs(query, LIMITS.all.songs),
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
