/**
 * Simple in-memory LRU cache for API responses
 * This provides an additional caching layer on top of Next.js's built-in fetch cache
 * Useful for reducing redundant API calls during high traffic
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

class LRUCache<T> {
  private cache: Map<string, CacheEntry<T>> = new Map();
  private maxSize: number;
  private defaultTTL: number;

  constructor(maxSize: number = 500, defaultTTLSeconds: number = 3600) {
    this.maxSize = maxSize;
    this.defaultTTL = defaultTTLSeconds * 1000;
  }

  get(key: string): T | null {
    const entry = this.cache.get(key);

    if (!entry) return null;

    // Check if expired
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    // Move to end (most recently used)
    this.cache.delete(key);
    this.cache.set(key, entry);

    return entry.data;
  }

  set(key: string, data: T, ttlSeconds?: number): void {
    // If at capacity, remove oldest entry (first in Map)
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) this.cache.delete(firstKey);
    }

    const ttl = ttlSeconds ? ttlSeconds * 1000 : this.defaultTTL;

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      expiresAt: Date.now() + ttl,
    });
  }

  has(key: string): boolean {
    return this.get(key) !== null;
  }

  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  get size(): number {
    return this.cache.size;
  }
}

// Singleton instances for different cache types
// Artist info cache - 24 hour TTL, up to 1000 entries
export const artistCache = new LRUCache<any>(1000, 86400);

// Album/release cache - 24 hour TTL, up to 2000 entries
export const albumCache = new LRUCache<any>(2000, 86400);

// Search results cache - 6 hour TTL, up to 500 entries
export const searchCache = new LRUCache<any>(500, 21600);

// YouTube video ID cache - 7 day TTL, up to 500 entries (for faster track switching)
export const youtubeCache = new LRUCache<string>(500, 604800);

// Playlist cache - 6 hour TTL, up to 100 entries
export const playlistCache = new LRUCache<any>(100, 21600);

// Playlist enrichment cache - 6 hour TTL, up to 200 entries.
// Keyed by a sorted, joined string of song IDs so repeated playlist views
// (the same Top 100 / editorial playlist viewed by many users) reuse the
// same enrichment map instead of re-fetching from Apple Music each time.
export const playlistEnrichCache = new LRUCache<Record<string, unknown>>(
  200,
  21600,
);

// ─── Single-flight (in-flight request deduplication) ─────────────────────────
//
// When multiple callers request the same key concurrently and the LRU/Next
// caches miss, only the first call actually performs the upstream work; the
// others await the same promise. This collapses cache-stampedes (thundering
// herds) into one origin load per key. The in-flight entry is removed on
// settlement so a later cold miss runs normally.

const inflight = new Map<string, Promise<unknown>>();

export async function singleFlight<T>(
  key: string,
  fn: () => Promise<T>,
): Promise<T> {
  const existing = inflight.get(key);
  if (existing) return existing as Promise<T>;

  const promise = fn().finally(() => {
    inflight.delete(key);
  });
  inflight.set(key, promise);
  return promise;
}

// ─── Cache tag naming ────────────────────────────────────────────────────────
//
// Centralised tag names so call sites and invalidations share a single source
// of truth. Used both by Next.js Data Cache (fetch `next.tags`) and by
// `revalidateAppleTag()` for on-demand invalidation.

export const appleTags = {
  artist: (id: string) => `apple-artist-${id}`,
  album: (id: string) => `apple-album-${id}`,
  playlist: (id: string) => `apple-playlist-${id}`,
  search: (q: string) => `apple-search-${q}`,
  trending: "apple-trending",
  dailyTop100: "apple-daily-top-100",
} as const;
