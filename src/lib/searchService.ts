/**
 * searchService.ts — Hybrid Smart Search
 *
 * Combines MusicBrainz (structural metadata) with Last.fm (popularity ranking)
 * to surface the truly "famous" songs first.
 *
 * Refactored for Senior Engineering Standards:
 * - Strict Typing (No 'any')
 * - Modular Architecture
 * - Batched Optimization for Performance
 */

import { searchCache } from "@/lib/cache";
import {
  buildSmartLuceneQuery,
  smartRerank,
  normalizeText,
  collapseSpaces,
  escapeLuceneValue,
} from "@/lib/smartSearch";
import { searchLastFmTracks } from "@/lib/lastfm";
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
const USER_AGENT = "SongRates/1.0 (mpittas@gmail.com)"; // Replace with config var in production

/** Fetch limits */
const LIMITS = {
  single: { artists: 20, albums: 25, songs: 40 },
  all: { artists: 10, albums: 12, songs: 15 },
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

// ─── Types: MusicBrainz API Responses ──────────────────────────────────────────

interface MBArtistCredit {
  name: string;
  artist?: {
    id: string;
    name: string;
  };
}

interface MBReleaseGroup {
  id: string;
  title: string;
  "primary-type"?: string;
  "first-release-date"?: string;
  "artist-credit"?: MBArtistCredit[];
  score?: number;
}

interface MBRelease {
  id: string;
  title: string;
  date?: string;
  status?: string; // e.g., "Official"
  country?: string;
  "release-group"?: MBReleaseGroup;
}

interface MBRecording {
  id: string;
  title: string;
  length?: number;
  score?: number;
  "first-release-date"?: string;
  "artist-credit"?: MBArtistCredit[];
  releases?: MBRelease[];
}

interface MBSearchResponse<T> {
  created: string;
  count: number;
  offset: number;
  artists?: T[]; // For artist search
  "release-groups"?: T[]; // For release-group search
  recordings?: T[]; // For recording search
}

// ─── In-flight Request Deduplication ───────────────────────────────────────────

const inflightRequests = new Map<string, Promise<unknown>>();

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
    // Ensure we always request JSON format
    const separator = path.includes("?") ? "&" : "?";
    const url = `${MB_BASE_URL}/${path}${separator}fmt=json`;

    const res = await fetch(url, {
      headers: {
        "User-Agent": USER_AGENT,
        Accept: "application/json",
      },
      next: { revalidate: 1800 }, // 30 min revalidation
    });

    if (!res.ok) {
      if (res.status !== 404) {
        console.warn(`MB API Warning: ${res.status} for ${path}`);
      }
      return null;
    }
    return (await res.json()) as T;
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

function countOfficialReleases(releases: MBRelease[]): number {
  return releases.filter((r) => r.status === "Official").length;
}

function hasAlbumTypeRelease(releases: MBRelease[]): boolean {
  return releases.some((r) => r["release-group"]?.["primary-type"] === "Album");
}

function findOriginalAlbum(
  releases: MBRelease[],
):
  | { id: string; title: string; date: string; primaryType?: string }
  | undefined {
  const albumReleases = releases
    .filter((r) => {
      const rg = r["release-group"];
      return (
        rg?.id &&
        rg["primary-type"] === "Album" &&
        (!r.status || r.status === "Official")
      );
    })
    .sort((a, b) => {
      const dateA = a.date || "9999";
      const dateB = b.date || "9999";
      return dateA.localeCompare(dateB);
    });

  if (albumReleases.length > 0) {
    const r = albumReleases[0];
    const rg = r["release-group"]!;
    return {
      id: rg.id,
      title: rg.title,
      date: r.date || "",
      primaryType: rg["primary-type"],
    };
  }
  return undefined;
}

// ─── Core: Song Search Logic ───────────────────────────────────────────────────

/**
 * 1. Fetch Candidates (Broad + Targeted Batch)
 */
async function fetchSongCandidates(
  query: string,
  limit: number,
): Promise<{
  recordings: MBRecording[];
  popularityMap: Map<string, number>;
}> {
  // A. Start Broad MB Search + Last.fm in TRUE parallel
  const luceneQuery = buildSmartLuceneQuery("recording", query);
  const broadPromise = fetchMB<MBSearchResponse<MBRecording>>(
    `recording?query=${encodeURIComponent(luceneQuery)}&limit=${limit}`,
  );
  const lastFmPromise = searchLastFmTracks(query, 20);

  // B. Await both in parallel
  const [broadData, lastFmTracks] = await Promise.all([
    broadPromise,
    lastFmPromise,
  ]);

  const broadRecordings = broadData?.recordings || [];

  // C. Build Popularity Map
  const popularityMap = new Map<string, number>();
  const topHits: { name: string; artist: string }[] = [];

  lastFmTracks.forEach((track, index) => {
    const key = `${cleanString(track.artist)}:${cleanString(track.name)}`;
    const existing = popularityMap.get(key) || 0;
    popularityMap.set(key, Math.max(existing, track.listeners));

    if (index < 3) {
      topHits.push({ name: track.name, artist: track.artist });
    }
  });

  // D. Targeted injection — only if we have top hits AND broad results might miss them
  if (topHits.length > 0) {
    const batchParts = topHits.map((hit) => {
      const rQuery = escapeLuceneValue(hit.name);
      const aQuery = escapeLuceneValue(hit.artist);
      return `(recording:"${rQuery}" AND artist:"${aQuery}")`;
    });

    const batchQuery = batchParts.join(" OR ");
    const targetedData = await fetchMB<MBSearchResponse<MBRecording>>(
      `recording?query=${encodeURIComponent(batchQuery)}&limit=10`,
    );

    const targetedRecordings = targetedData?.recordings || [];
    return {
      recordings: [...broadRecordings, ...targetedRecordings],
      popularityMap,
    };
  }

  return {
    recordings: broadRecordings,
    popularityMap,
  };
}

/**
 * 2. Deduplicate Recordings
 * Merges duplicate entries (MusicBrainz often has many IDs for same song).
 * Prefer Older > Official Release Count.
 */
function deduplicateRecordings(recordings: MBRecording[]): MBRecording[] {
  const dedupMap = new Map<string, MBRecording>();

  for (const rec of recordings) {
    const title = cleanString(rec.title || "");
    const artist = cleanString(rec["artist-credit"]?.[0]?.name || "");
    const key = `${artist}:${title}`;

    const existing = dedupMap.get(key);

    if (!existing) {
      dedupMap.set(key, rec);
      continue;
    }

    // Comparison Logic
    const recOfficial = countOfficialReleases(rec.releases || []);
    const existingOfficial = countOfficialReleases(existing.releases || []);

    // Default to far future if date is missing
    const recDate = rec["first-release-date"] || "9999-99-99";
    const existingDate = existing["first-release-date"] || "9999-99-99";

    let shouldReplace = false;

    if (recDate < existingDate) {
      shouldReplace = true; // Significantly older is likely the original
    } else if (recDate === existingDate) {
      // Tie-break: which has more official releases?
      shouldReplace = recOfficial > existingOfficial;
    }

    if (shouldReplace) {
      dedupMap.set(key, rec);
    }
  }

  return Array.from(dedupMap.values());
}

/**
 * 3. Calculate Score
 * Composite of Last.fm listeners and MusicBrainz structural "fame".
 */
function calculateSongScore(
  rec: MBRecording,
  popularityMap: Map<string, number>,
): { score: number; listeners: number } {
  const title = cleanString(rec.title || "");
  const artist = cleanString(rec["artist-credit"]?.[0]?.name || "");
  const key = `${artist}:${title}`;

  const listeners = popularityMap.get(key) || 0;
  const officialCount = countOfficialReleases(rec.releases || []);

  // Scoring Formula:
  // 1. Listeners (Primary): Direct measure of popularity
  // 2. Official Releases (Secondary): Fallback proxy for fame
  // We scale releases x1000 to be roughly comparable to listener counts for sorting
  const score = listeners > 0 ? listeners : officialCount * 1000;

  return { score, listeners };
}

// ─── Implementation: Search Songs ──────────────────────────────────────────────

async function searchSongs(
  query: string,
  limit: number = LIMITS.single.songs,
): Promise<SongSearchResult[]> {
  const cacheKey = `search:song:v2:${normalizeText(query)}:${limit}`;
  const cached = searchCache.get(cacheKey);
  if (cached) return cached as SongSearchResult[];

  return deduplicatedFetch(cacheKey, async () => {
    // 1. Fetch
    const { recordings, popularityMap } = await fetchSongCandidates(
      query,
      limit,
    );

    if (recordings.length === 0) return [];

    // 2. Deduplicate
    const uniqueRecordings = deduplicateRecordings(recordings);

    // 3. Score & Sort
    const scored = uniqueRecordings.map((rec) => {
      const { score, listeners } = calculateSongScore(rec, popularityMap);
      return { rec, score, listeners };
    });

    scored.sort((a, b) => b.score - a.score);

    // 4. Map to DTO
    const results: SongSearchResult[] = scored
      .slice(0, RETURN_LIMITS.songs)
      .map(({ rec, listeners }) => {
        const releases = rec.releases || [];
        const originalAlbum = findOriginalAlbum(releases);
        const bestRG =
          originalAlbum ||
          releases[0]?.["release-group"] ||
          ({ id: "", title: "" } as MBReleaseGroup);

        return {
          id: rec.id,
          type: "song" as const,
          title: rec.title,
          subtitle: rec["artist-credit"]?.[0]?.name,
          score: rec.score ?? 0,
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
          // bestRG is either the originalAlbum object (which now has primaryType)
          // or the ReleaseGroup object (which has "primary-type").
          // We need to handle both key styles.
          primaryType:
            "primaryType" in bestRG
              ? bestRG.primaryType
              : (bestRG as MBReleaseGroup)["primary-type"],
          listenCount: listeners > 0 ? listeners : undefined,
        };
      });

    searchCache.set(cacheKey, results, 1800);
    return results;
  });
}

// ─── Implementation: Artists & Albums ──────────────────────────────────────────

async function searchArtists(
  query: string,
  limit: number = LIMITS.single.artists,
): Promise<ArtistSearchResult[]> {
  const cacheKey = `search:artist:${normalizeText(query)}:${limit}`;
  // ... caching logic similar to songs ...
  const cached = searchCache.get(cacheKey);
  if (cached) return cached as ArtistSearchResult[];

  return deduplicatedFetch(cacheKey, async () => {
    const luceneQuery = buildSmartLuceneQuery("artist", query);
    const data = await fetchMB<
      MBSearchResponse<{
        id: string;
        name: string;
        score: number;
        country?: string;
        type?: string;
        disambiguation?: string;
      }>
    >(`artist?query=${encodeURIComponent(luceneQuery)}&limit=${limit}`);

    if (!data?.artists) return [];

    const results: ArtistSearchResult[] = data.artists
      .slice(0, RETURN_LIMITS.artists)
      .map((a) => ({
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

async function searchAlbums(
  query: string,
  limit: number = LIMITS.single.albums,
): Promise<AlbumSearchResult[]> {
  const cacheKey = `search:album:${normalizeText(query)}:${limit}`;
  const cached = searchCache.get(cacheKey);
  if (cached) return cached as AlbumSearchResult[];

  return deduplicatedFetch(cacheKey, async () => {
    const luceneQuery = buildSmartLuceneQuery("releasegroup", query);
    const data = await fetchMB<MBSearchResponse<MBReleaseGroup>>(
      `release-group?query=${encodeURIComponent(luceneQuery)}&limit=${limit}`,
    );

    if (!data?.["release-groups"]) return [];

    const results: AlbumSearchResult[] = data["release-groups"]
      .filter((rg) =>
        ["Album", "EP", "Single"].includes(rg["primary-type"] || ""),
      )
      .slice(0, RETURN_LIMITS.albums)
      .map((rg) => ({
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

// ─── Public API ────────────────────────────────────────────────────────────────

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
