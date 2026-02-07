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
  smartMatchScore,
  normalizeText,
  collapseSpaces,
  escapeLuceneValue,
} from "@/lib/smartSearch";
import {
  searchLastFmTracks,
  searchLastFmAlbums,
  fetchTrackPlaycounts,
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

const MB_BASE_URL = "https://musicbrainz.org/ws/2";
const USER_AGENT = "SongRates/1.0 (mpittas@gmail.com)";

/** Fetch limits */
const LIMITS = {
  single: { artists: 80, albums: 60, songs: 60 }, // MB limit lowered for songs as we rely on ranking
  all: { artists: 50, albums: 25, songs: 25 },
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

// MusicBrainz requires max 1 request per second per IP.
// We space out *start times* to reduce 503s while still allowing
// concurrent in-flight requests for faster initial search.
const MB_MIN_GAP_MS = 250;
let mbNextStart = 0;

async function waitForMbSlot(): Promise<void> {
  if (process.env.NODE_ENV === "test") return;
  const now = Date.now();
  const scheduled = Math.max(now, mbNextStart);
  mbNextStart = scheduled + MB_MIN_GAP_MS;
  const wait = scheduled - now;
  if (wait > 0) await new Promise((r) => setTimeout(r, wait));
}

async function fetchMB<T>(path: string): Promise<T | null> {
  await waitForMbSlot();
  return fetchMBInternal<T>(path);
}

async function fetchMBInternal<T>(path: string): Promise<T | null> {
  try {
    const fetchInit: any = {
      headers: {
        "User-Agent": USER_AGENT,
        Accept: "application/json",
      },
    };

    if (process.env.NODE_ENV !== "test") {
      fetchInit.next = { revalidate: 1800 };
    }

    const res = await fetch(`${MB_BASE_URL}/${path}`, fetchInit);

    // Retry once on 503 (rate limit)
    if (res.status === 503) {
      await new Promise((r) => setTimeout(r, 1000));
      await waitForMbSlot();
      const retry = await fetch(`${MB_BASE_URL}/${path}`, fetchInit);
      if (!retry.ok) {
        console.error(`MB API ${retry.status} for ${path} (after retry)`);
        return null;
      }
      return retry.json();
    }

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

// ─── Artist Metadata Enrichment ─────────────────────────────────────────────────

interface ArtistMeta {
  country?: string;
  type?: string;
  disambiguation?: string;
  tags?: string[];
}

/**
 * Batch-fetch artist metadata (country, type, disambiguation, tags) from MB.
 * Uses a single artist search query to avoid N+1 lookups.
 */
async function fetchArtistMetadata(
  artistIds: string[],
): Promise<Map<string, ArtistMeta>> {
  const metaMap = new Map<string, ArtistMeta>();
  if (artistIds.length === 0) return metaMap;

  // Fetch up to 10 artists in parallel using individual lookups (fast, cached)
  const promises = artistIds.slice(0, 10).map(async (id) => {
    const data = await fetchMB<any>(`artist/${id}?inc=tags&fmt=json`);
    if (!data) return;

    const tags = (data.tags || [])
      .sort((a: any, b: any) => (b.count || 0) - (a.count || 0))
      .slice(0, 3)
      .map((t: any) => t.name);

    metaMap.set(id, {
      country: data.area?.name || data.country || undefined,
      type: data.type || undefined,
      disambiguation: data.disambiguation || undefined,
      tags: tags.length > 0 ? tags : undefined,
    });
  });

  await Promise.all(promises);
  return metaMap;
}

// ─── Artist Search ──────────────────────────────────────────────────────────────

async function searchArtists(
  query: string,
  limit: number = LIMITS.single.artists,
  quick: boolean = false,
): Promise<ArtistSearchResult[]> {
  const cacheKey = `search:artist:${normalizeText(query)}:${limit}${quick ? ":quick" : ""}`;
  const cached = searchCache.get(cacheKey);
  if (cached) return cached as ArtistSearchResult[];

  return deduplicatedFetch(cacheKey, async () => {
    const luceneQuery = buildSmartLuceneQuery("artist", query);
    const path = `release-group?query=${encodeURIComponent(luceneQuery)}&limit=${limit}&fmt=json`;

    const data = await fetchMB<any>(path);
    if (!data) return [];

    const artistMap = new Map<
      string,
      { id: string; name: string; score: number; releaseGroupCount: number }
    >();

    // Only count release-groups that represent real discography
    // (Album, EP, Single) and exclude compilations / live / etc.
    const ALLOWED_PRIMARY = new Set(["Album", "EP", "Single"]);
    const EXCLUDED_SECONDARY = new Set([
      "Compilation",
      "Live",
      "Remix",
      "DJ-mix",
      "Mixtape/Street",
      "Spokenword",
      "Interview",
      "Audiobook",
      "Audio drama",
      "Demo",
      "Field recording",
    ]);

    for (const rg of data["release-groups"] || []) {
      // Skip release-groups that won't appear on the artist page
      if (!ALLOWED_PRIMARY.has(rg["primary-type"])) continue;
      const secondaryTypes: string[] = rg["secondary-types"] || [];
      if (secondaryTypes.some((t) => EXCLUDED_SECONDARY.has(t))) continue;

      const credit0 = rg["artist-credit"]?.[0];
      const artistId = credit0?.artist?.id;
      const artistName = credit0?.name || credit0?.artist?.name;
      if (!artistId || !artistName) continue;

      const rgScore = rg.score ?? 0;
      const existing = artistMap.get(artistId);
      if (!existing) {
        artistMap.set(artistId, {
          id: artistId,
          name: artistName,
          score: rgScore,
          releaseGroupCount: 1,
        });
        continue;
      }

      existing.releaseGroupCount += 1;
      existing.score = Math.max(existing.score, rgScore);
    }

    const topArtists = Array.from(artistMap.values())
      .sort(
        (a, b) =>
          b.score - a.score || b.releaseGroupCount - a.releaseGroupCount,
      )
      .slice(0, RETURN_LIMITS.artists);

    // Enrich with country, type, disambiguation, and genre tags
    // Skip in quick mode (used by searchAll) to avoid N+1 API calls
    const metaMap = quick
      ? new Map<string, ArtistMeta>()
      : await fetchArtistMetadata(topArtists.map((a) => a.id));

    const results: ArtistSearchResult[] = topArtists.map((a) => {
      const meta = metaMap.get(a.id);
      return {
        id: a.id,
        type: "artist" as const,
        title: a.name,
        score: a.score,
        country: meta?.country,
        artistType: meta?.type,
        disambiguation: meta?.disambiguation,
        tags: meta?.tags,
      };
    });

    const reranked = smartRerank(results, query);
    if (reranked.length > 0) {
      searchCache.set(cacheKey, reranked, 1800);
    }

    // Pre-populate slug resolution cache so artist pages load instantly
    for (const r of reranked) {
      const slug = createSlug(r.title, r.id);
      searchCache.set(`resolve-artist:${slug}`, r.id, 86400);
    }

    return reranked;
  });
}

// ─── Hybrid Album Search ────────────────────────────────────────────────────────
// Fetches MB candidates AND Last.fm popularity ranking in parallel.
// Merges them to ensure the most popular albums are surfaced first.

async function searchAlbums(
  query: string,
  limit: number = LIMITS.single.albums,
  quick: boolean = false,
  skipLastFm: boolean = false,
): Promise<AlbumSearchResult[]> {
  const cacheKey = `search:album:hybrid:${normalizeText(query)}:${limit}${quick ? ":quick" : ""}${skipLastFm ? ":nofm" : ""}`;
  const cached = searchCache.get(cacheKey);
  if (cached) return cached as AlbumSearchResult[];

  return deduplicatedFetch(cacheKey, async () => {
    // 1. Parallel Fetch: MB candidates + Last.fm popularity ranking
    const luceneQuery = buildSmartLuceneQuery("releasegroup", query);
    const mbPromise = fetchMB<any>(
      `release-group?query=${encodeURIComponent(luceneQuery)}&limit=${limit}&fmt=json`,
    );
    let data: any | null = null;
    let lastFmAlbums: Awaited<ReturnType<typeof searchLastFmAlbums>> = [];

    if (skipLastFm) {
      data = await mbPromise;
    } else {
      const lastFmPromise = searchLastFmAlbums(
        query,
        quick ? 15 : 30,
        quick ? 0 : 10,
      );
      [data, lastFmAlbums] = await Promise.all([mbPromise, lastFmPromise]);
    }
    if (!data) return [];

    // 2. Build Popularity Lookup Map from Last.fm
    // Key: "artist:title" (normalized) -> listeners
    const popularityMap = new Map<string, number>();
    lastFmAlbums.forEach((album, index) => {
      const key = `${cleanString(album.artist)}:${cleanString(album.name)}`;
      const existing = popularityMap.get(key) || 0;
      // Use listeners if available, otherwise use rank-based score
      const score =
        album.listeners > 0 ? album.listeners : Math.max(1000 - index * 30, 10);
      popularityMap.set(key, Math.max(existing, score));
    });

    // 3. Filter and deduplicate MB results
    // Only show studio Albums, other Albums, and EPs — exclude Singles and Compilations
    const releaseGroups = (data["release-groups"] || []).filter((rg: any) => {
      const primaryType = rg["primary-type"];
      if (!["Album", "EP"].includes(primaryType)) return false;
      const secondaryTypes: string[] = rg["secondary-types"] || [];
      if (secondaryTypes.includes("Compilation")) return false;
      return true;
    });

    // Deduplicate by normalized artist:title
    const dedupMap = new Map<string, any>();
    for (const rg of releaseGroups) {
      const title = cleanString(rg.title || "");
      const artist = cleanString(rg["artist-credit"]?.[0]?.name || "");
      const key = `${artist}:${title}`;
      if (!dedupMap.has(key)) {
        dedupMap.set(key, rg);
      }
    }

    // 4. Score and Sort by popularity with release-type boost
    const scored = Array.from(dedupMap.values()).map((rg: any) => {
      const title = cleanString(rg.title || "");
      const artist = cleanString(rg["artist-credit"]?.[0]?.name || "");
      const key = `${artist}:${title}`;

      const popularity = popularityMap.get(key) || 0;
      const mbScore = rg.score ?? 0;

      // Release type boost: prioritize main studio Albums > EPs > others
      const primaryType = rg["primary-type"];
      const secondaryTypes: string[] = rg["secondary-types"] || [];
      const isMain = !secondaryTypes.some((t: string) =>
        [
          "Compilation",
          "Soundtrack",
          "Live",
          "Remix",
          "DJ-mix",
          "Mixtape/Street",
          "Spokenword",
          "Interview",
          "Audiobook",
          "Audio drama",
          "Demo",
        ].includes(t),
      );

      let typeBoost = 1.0;
      if (primaryType === "Album" && isMain) typeBoost = 1.5;
      else if (primaryType === "EP" && isMain) typeBoost = 1.2;
      else if (primaryType === "Album") typeBoost = 1.1;
      else if (primaryType === "EP") typeBoost = 1.05;
      // Singles get no boost (1.0)

      // Composite: popularity is dominant when available, MB score as tiebreaker
      const baseScore = popularity > 0 ? popularity + mbScore : mbScore;
      const compositeScore = baseScore * typeBoost;

      return { rg, compositeScore, popularity };
    });

    scored.sort((a, b) => b.compositeScore - a.compositeScore);

    const top = scored.slice(0, RETURN_LIMITS.albums);

    // 5. Map to Result
    const results: AlbumSearchResult[] = top.map(({ rg, popularity }) => ({
      id: rg.id,
      type: "album" as const,
      title: rg.title,
      subtitle: rg["artist-credit"]?.[0]?.name,
      score: rg.score ?? 0,
      artistName: rg["artist-credit"]?.[0]?.name,
      artistId: rg["artist-credit"]?.[0]?.artist?.id,
      releaseDate: rg["first-release-date"],
      primaryType: rg["primary-type"],
      secondaryTypes: rg["secondary-types"] || [],
    }));

    const reranked = smartRerank(results, query);
    if (reranked.length > 0) {
      searchCache.set(cacheKey, reranked, 1800);
    }

    // Pre-populate slug resolution cache so album pages load instantly
    for (const r of reranked) {
      const slug = createSlug(r.title, r.id);
      searchCache.set(`resolve-album:${slug}`, r.id, 86400);
    }

    return reranked;
  });
}

// ─── Hybrid Song Search ────────────────────────────────────────────────────────
// Fetches MB candidates AND Last.fm popularity ranking in parallel.
// Merges them to ensure the most popular song (based on listeners) is top.

async function searchSongs(
  query: string,
  limit: number = LIMITS.single.songs,
  quick: boolean = false,
  skipLastFm: boolean = false,
): Promise<SongSearchResult[]> {
  const cacheKey = `search:song:hybrid:${normalizeText(query)}:${limit}${quick ? ":quick" : ""}${skipLastFm ? ":nofm" : ""}`;
  const cached = searchCache.get(cacheKey);
  if (cached) return cached as SongSearchResult[];

  return deduplicatedFetch(cacheKey, async () => {
    // 1. Fire MB + Last.fm searches in parallel (both are slow, no dependency)
    const luceneQuery = buildSmartLuceneQuery("recording", query);
    const broadMbPromise = fetchMB<any>(
      `recording?query=${encodeURIComponent(luceneQuery)}&limit=${limit}&fmt=json`,
    );
    let recordings: any[];
    let lastFmTracks: Awaited<ReturnType<typeof searchLastFmTracks>> = [];

    if (skipLastFm) {
      const broadData = await broadMbPromise;
      if (!broadData) return [];
      recordings = broadData.recordings || [];
    } else {
      const lastFmPromise = searchLastFmTracks(
        query,
        quick ? 15 : 50,
        quick ? 0 : 10,
      );

      if (quick) {
        // Quick mode: MB + Last.fm in parallel, no targeted injection
        const [broadData, lfmTracks] = await Promise.all([
          broadMbPromise,
          lastFmPromise,
        ]);
        if (!broadData) return [];
        recordings = broadData.recordings || [];
        lastFmTracks = lfmTracks;
      } else {
        // Last.fm is already running in parallel with MB broad search.
        // Await it so we can build targeted MB queries from top hits.
        lastFmTracks = await lastFmPromise;

        // Targeted Injection: fetch MB metadata for top Last.fm hits
        // to guarantee the most popular songs appear even if the broad search missed them
        const topHits = lastFmTracks.slice(0, 3);

        const targetedPromises = topHits.map(async (hit) => {
          const targetQuery = `recording:"${escapeLuceneValue(hit.name)}" AND artist:"${escapeLuceneValue(hit.artist)}"`;
          const path = `recording?query=${encodeURIComponent(targetQuery)}&limit=10&fmt=json`;
          return fetchMB<any>(path);
        });

        const [broadData, ...targetedResults] = await Promise.all([
          broadMbPromise,
          ...targetedPromises,
        ]);

        if (!broadData && targetedResults.length === 0) return [];

        const broadRecordings = broadData?.recordings || [];
        const targetedRecordings = targetedResults.flatMap(
          (r) => r?.recordings || [],
        );
        recordings = [...broadRecordings, ...targetedRecordings];
      }
    }

    // 2. Build Popularity Lookup Map
    // Key: "artist:title" (normalized) -> playcount/listeners
    const popularityMap = new Map<string, number>();

    lastFmTracks.forEach((track) => {
      const key = `${cleanString(track.artist)}:${cleanString(track.name)}`;
      const existing = popularityMap.get(key) || 0;
      // Use playcount if available, otherwise fall back to listeners
      const count = track.playcount ?? track.listeners;
      popularityMap.set(key, Math.max(existing, count));
    });

    // 3. Deduplicate MB results — keep the best recording per artist:title
    // IMPORTANT: Do NOT merge releases across different recording IDs.
    // Each recording's releases are the ones it actually appears on.
    // Merging releases caused bugs where a recording would link to an album
    // it doesn't actually belong to ("hallucinated" results).
    const dedupMap = new Map<string, any>();
    recordings.forEach((rec) => {
      const title = cleanString(rec.title || "");
      const artist = cleanString(rec["artist-credit"]?.[0]?.name || "");
      const key = `${artist}:${title}`;

      const existing = dedupMap.get(key);

      if (!existing) {
        dedupMap.set(key, { ...rec, releases: [...(rec.releases || [])] });
        return;
      }

      // Pick the better recording: prefer the one with more official releases,
      // then the one with the earliest release date.
      const existingOfficialCount = countOfficialReleases(
        existing.releases || [],
      );
      const recOfficialCount = countOfficialReleases(rec.releases || []);

      let replace = false;
      if (recOfficialCount > existingOfficialCount) {
        replace = true;
      } else if (recOfficialCount === existingOfficialCount) {
        const recDate = rec["first-release-date"] || "9999-99-99";
        const existingDate = existing["first-release-date"] || "9999-99-99";
        if (recDate < existingDate) {
          replace = true;
        }
      }

      if (replace) {
        dedupMap.set(key, { ...rec, releases: [...(rec.releases || [])] });
      }
    });

    // Filter: only keep recordings that appear on Album, EP, or Single
    // AND that are actually relevant to the user's query.
    const deduped = Array.from(dedupMap.values()).filter((rec) => {
      if (!hasAllowedReleaseType(rec.releases || [])) return false;
      return isRelevantRecording(query, rec);
    });

    // 4. Score and Sort
    const scored = deduped.map((rec) => {
      const title = cleanString(rec.title || "");
      const artist = cleanString(rec["artist-credit"]?.[0]?.name || "");
      const key = `${artist}:${title}`;

      // Get popularity from Last.fm (playcount or listeners)
      const popularity = popularityMap.get(key) || 0;

      // Fallback: Use official release count as a proxy if no Last.fm data
      const officialCount = countOfficialReleases(rec.releases || []);

      // Composite Score:
      // If we have popularity, that's the dominant factor.
      // If not, we rely on release count.
      // We normalize popularity roughly (1M plays = high score)
      const popularityScore =
        popularity > 0 ? popularity : officialCount * 1000; // 1 release ~= 1000 plays fallback

      // Boost recordings that appear on main studio albums or EPs
      const releaseBoost = getReleaseTypeBoost(rec.releases || []);

      return { rec, score: popularityScore * releaseBoost, popularity };
    });

    // Sort descending by score
    scored.sort((a, b) => b.score - a.score);

    const top = scored.slice(0, RETURN_LIMITS.songs);

    // 5. Map to Result
    const results: SongSearchResult[] = top.map(({ rec, popularity }) => {
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
        releaseType: originalAlbum
          ? originalAlbum.primaryType === "Album"
            ? originalAlbum.isMain
              ? "Album"
              : "Other album"
            : originalAlbum.primaryType
          : undefined,
        // Use Last.fm playcount (or listeners as fallback)
        listenCount: popularity > 0 ? popularity : undefined,
      };
    });

    const reranked = smartRerank(results, query);

    // 6. Second-pass enrichment: fetch Last.fm playcounts for results missing them.
    // The initial Last.fm search only covers its top results, so songs found via
    // MusicBrainz but not in Last.fm's top search hits will be missing playcounts.
    // Skip in quick mode to keep the "all" search fast.
    if (!quick) {
      const missing = reranked.filter(
        (r) => r.listenCount == null && r.artistName && r.title,
      );
      if (missing.length > 0) {
        const enriched = await fetchTrackPlaycounts(
          missing.map((r) => ({ name: r.title, artist: r.artistName! })),
        );
        for (const r of reranked) {
          if (r.listenCount == null && r.artistName) {
            const key = `${r.artistName}:${r.title}`;
            const count = enriched.get(key);
            if (count && count > 0) {
              r.listenCount = count;
            }
          }
        }
      }
    }

    if (reranked.length > 0) {
      searchCache.set(cacheKey, reranked, 1800);
    }
    return reranked;
  });
}

// ─── ListenBrainz Enrichment ────────────────────────────────────────────────────

const LISTENBRAINZ_BASE_URL = "https://api.listenbrainz.org/1";

/**
 * Fetch total listen counts from ListenBrainz for a batch of recording MBIDs.
 * Same data source as the album tracklist, ensuring numbers match.
 */
async function fetchListenBrainzCounts(
  recordingMbids: string[],
): Promise<Record<string, number>> {
  if (recordingMbids.length === 0) return {};

  try {
    const res = await fetch(`${LISTENBRAINZ_BASE_URL}/popularity/recording`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": USER_AGENT,
      },
      body: JSON.stringify({ recording_mbids: recordingMbids.slice(0, 50) }),
    });

    if (!res.ok) return {};

    const data = await res.json();
    const items = Array.isArray(data)
      ? data
      : Array.isArray(data?.payload)
        ? data.payload
        : [];

    const counts: Record<string, number> = {};
    for (const entry of items) {
      if (
        entry.recording_mbid &&
        typeof entry.total_listen_count === "number"
      ) {
        counts[entry.recording_mbid] = entry.total_listen_count;
      }
    }
    return counts;
  } catch (err) {
    console.error("ListenBrainz enrichment error:", err);
    return {};
  }
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Check if a recording is relevant to the user's query.
 * Uses word-overlap analysis to filter out fuzzy search noise.
 *
 * For multi-word queries (2+ significant words), at least half the query words
 * must appear in the recording's title OR artist name.
 *   - "No you girls" vs "girls with gills" → 1/3 overlap → REJECT
 *   - "No you girls" vs "No You Girls"     → 3/3 overlap → KEEP
 *
 * For single-word queries, uses smartMatchScore with a threshold.
 */
function isRelevantRecording(query: string, rec: any): boolean {
  const normQuery = normalizeText(query);
  const normTitle = normalizeText(rec.title || "");
  const normArtist = normalizeText(rec["artist-credit"]?.[0]?.name || "");

  // Combine title + artist for word matching
  const combinedWords = new Set(
    `${normTitle} ${normArtist}`.split(/\s+/).filter((w) => w.length > 0),
  );

  const queryWords = normQuery.split(/\s+/).filter((w) => w.length > 1);

  if (queryWords.length >= 2) {
    // Multi-word query: require at least half the query words to appear
    const matched = queryWords.filter((w) => combinedWords.has(w)).length;
    const ratio = matched / queryWords.length;
    return ratio >= 0.5;
  }

  // Single-word query: use smartMatchScore threshold
  const titleScore = smartMatchScore(query, rec.title || "");
  const artistScore = smartMatchScore(query, normArtist);
  return Math.max(titleScore, artistScore) >= 50;
}

function countOfficialReleases(releases: any[]): number {
  return releases.filter((r: any) => r.status === "Official").length;
}

function isMainRelease(rg: any): boolean {
  const secondaryTypes: string[] =
    rg["secondary-types"] || rg["secondary-type-list"] || [];
  const dominated = [
    "Compilation",
    "Soundtrack",
    "Live",
    "Remix",
    "DJ-mix",
    "Mixtape/Street",
  ];
  return !secondaryTypes.some((t: string) => dominated.includes(t));
}

function getReleaseTypeBoost(releases: any[]): number {
  let bestBoost = 1.0;

  for (const r of releases) {
    const rg = r["release-group"];
    if (!rg) continue;
    if (r.status && r.status !== "Official") continue;

    const primaryType = rg["primary-type"];
    const main = isMainRelease(rg);

    if (primaryType === "Album" && main) {
      return 1.5; // Best: main studio album
    } else if (primaryType === "EP" && main) {
      bestBoost = Math.max(bestBoost, 1.3);
    } else if (primaryType === "Album" || primaryType === "EP") {
      bestBoost = Math.max(bestBoost, 1.1); // Compilation/soundtrack album or EP
    }
  }

  return bestBoost;
}

function hasAlbumTypeRelease(releases: any[]): boolean {
  return releases.some(
    (r: any) => r["release-group"]?.["primary-type"] === "Album",
  );
}

const ALLOWED_RELEASE_TYPES = new Set(["Album", "EP", "Single"]);

function hasAllowedReleaseType(releases: any[]): boolean {
  return releases.some((r: any) =>
    ALLOWED_RELEASE_TYPES.has(r["release-group"]?.["primary-type"]),
  );
}

function findOriginalAlbum(releases: any[]):
  | {
      id: string;
      title: string;
      date: string;
      primaryType: string;
      isMain: boolean;
    }
  | undefined {
  // Prioritize: main studio albums > main EPs > compilation albums > other
  const typePriority = (r: any): number => {
    const rg = r["release-group"];
    const primary = rg?.["primary-type"];
    const main = isMainRelease(rg || {});
    if (primary === "Album" && main) return 0;
    if (primary === "EP" && main) return 1;
    if (primary === "Album") return 2;
    if (primary === "EP") return 3;
    if (primary === "Single" && main) return 4;
    if (primary === "Single") return 5;
    return 6;
  };

  const candidates = releases
    .filter((r: any) => {
      const rg = r["release-group"];
      return (
        rg?.id &&
        ["Album", "EP", "Single"].includes(rg["primary-type"]) &&
        (!r.status || r.status === "Official")
      );
    })
    .sort((a: any, b: any) => {
      const prioA = typePriority(a);
      const prioB = typePriority(b);
      if (prioA !== prioB) return prioA - prioB;
      const dateA = a.date || "9999";
      const dateB = b.date || "9999";
      return dateA.localeCompare(dateB);
    });

  if (candidates.length > 0) {
    const rg = candidates[0]["release-group"];
    return {
      id: rg.id,
      title: rg.title,
      date: candidates[0].date || "",
      primaryType: rg["primary-type"] || "Album",
      isMain: isMainRelease(rg || {}),
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
  // Fire artist search first (most important for type-ahead), then
  // album + song in parallel. Last.fm calls inside album/song don't
  // use the MB queue so they start immediately alongside the MB requests.
  const artistsPromise = searchArtists(query, LIMITS.all.artists, true);
  const albumsPromise = searchAlbums(query, LIMITS.all.albums, true, true);
  const songsPromise = searchSongs(query, LIMITS.all.songs, true, true);

  const [artists, albums, songs] = await Promise.all([
    artistsPromise,
    albumsPromise,
    songsPromise,
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
