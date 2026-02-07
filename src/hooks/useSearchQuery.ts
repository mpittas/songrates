"use client";

import { useEffect } from "react";
import {
  useQuery,
  useQueryClient,
  keepPreviousData,
} from "@tanstack/react-query";
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
 *
 * Tab-switch optimization:
 *   When the "all" search completes, we seed per-category caches with the
 *   grouped results so switching tabs renders instantly from cache while the
 *   full single-category fetch runs in the background.
 */
export function useSearchQuery(query: string, category: SearchCategory) {
  const queryClient = useQueryClient();

  const queryResult = useQuery<SearchApiData>({
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

  // ─── Seed per-category caches from "all" results ──────────────────
  // When the "all" search returns grouped data, pre-populate the individual
  // category caches so tab switches show results instantly. The data is marked
  // stale so a background refetch with full single-category limits still runs.
  const grouped = queryResult.data?.grouped;
  useEffect(() => {
    if (category !== "all" || !grouped || !query) return;

    const seedCategory = (
      cat: "artist" | "album" | "song",
      results: SearchResult[],
    ) => {
      if (results.length === 0) return;
      const key = ["search", query, cat] as const;
      // Only seed if no data exists yet for this category+query
      const existing = queryClient.getQueryData(key);
      if (existing) return;
      queryClient.setQueryData<SearchApiData>(key, {
        results,
        meta: {
          query,
          category: cat,
          totalResults: results.length,
          took: 0,
        },
      });
      // Mark as stale so a background refetch with full limits still fires
      queryClient.invalidateQueries({ queryKey: key, refetchType: "none" });
    };

    seedCategory("artist", grouped.artists);
    seedCategory("album", grouped.albums);
    seedCategory("song", grouped.songs);
  }, [category, grouped, query, queryClient]);

  return queryResult;
}
