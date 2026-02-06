"use client";

import { useQuery, keepPreviousData } from "@tanstack/react-query";
import type {
  SearchCategory,
  SearchResult,
  GroupedSearchResults,
} from "@/types/search";

// ─── Types ─────────────────────────────────────────────────────────────────────

interface SearchApiData {
  results: SearchResult[];
  grouped?: GroupedSearchResults | null;
  meta?: {
    query: string;
    category: SearchCategory;
    totalResults: number;
    took: number;
  };
}

// ─── Fetcher ───────────────────────────────────────────────────────────────────

async function fetchSearchResults(
  query: string,
  category: SearchCategory,
  signal?: AbortSignal,
): Promise<SearchApiData> {
  const res = await fetch(
    `/api/search?q=${encodeURIComponent(query)}&category=${category}`,
    { signal },
  );

  if (!res.ok) {
    throw new Error(`Search failed: ${res.status}`);
  }

  const data = await res.json();
  return {
    results: data.results || [],
    grouped: data.grouped || null,
    meta: data.meta,
  };
}

// ─── Hook ──────────────────────────────────────────────────────────────────────

/**
 * TanStack React Query hook for search results.
 *
 * Benefits over manual fetch + useEffect:
 *   - Automatic request deduplication (same query won't fire twice)
 *   - Built-in caching with configurable stale/gc times
 *   - `placeholderData: keepPreviousData` keeps old results visible while new ones load
 *   - Automatic AbortController management (cancels stale requests)
 *   - No manual loading/error state management
 *   - Background refetching when data goes stale
 *   - Structural sharing prevents unnecessary re-renders
 */
export function useSearchQuery(query: string, category: SearchCategory) {
  return useQuery<SearchApiData>({
    // Query key includes both query and category for proper cache separation
    queryKey: ["search", query, category] as const,

    // Only fetch when we have a non-empty query
    enabled: query.trim().length > 0,

    queryFn: ({ signal }) => fetchSearchResults(query, category, signal),

    // Keep previous results visible while fetching new ones (no flash of empty state)
    placeholderData: keepPreviousData,

    // Cache configuration tuned for search:
    // - staleTime: 5 min — results are fresh for 5 min, no refetch needed
    // - gcTime: 30 min — cached results stay in memory for 30 min
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,

    // Don't refetch on window focus for search (user expects stable results)
    refetchOnWindowFocus: false,

    // Don't retry search failures aggressively
    retry: 1,
    retryDelay: 1000,
  });
}
