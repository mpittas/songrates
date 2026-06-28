"use client";

import { useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
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

// ─── Category extraction from "all" grouped data ─────────────────────────────

const CATEGORY_TO_GROUPED_KEY: Record<
  Exclude<SearchCategory, "all">,
  keyof GroupedSearchResults
> = {
  artist: "artists",
  album: "albums",
  song: "songs",
};

function extractCategoryFromAll(
  allData: SearchApiData,
  category: Exclude<SearchCategory, "all">,
): SearchApiData | undefined {
  const grouped = allData.grouped;
  if (!grouped) return undefined;
  const key = CATEGORY_TO_GROUPED_KEY[category];
  const results = grouped[key] as SearchResult[];
  if (!results || results.length === 0) return undefined;
  return {
    results,
    meta: {
      query: allData.meta?.query || "",
      category,
      totalResults: results.length,
      took: 0,
    },
  };
}

// ─── Hook ──────────────────────────────────────────────────────────────────────

/**
 * TanStack React Query hook for search results.
 *
 * Benefits over manual fetch + useEffect:
 *   - Automatic request deduplication (same query won't fire twice)
 *   - Built-in caching with configurable stale/gc times
 *   - Synchronous placeholder from "all" cache for instant tab switches
 *   - Automatic AbortController management (cancels stale requests)
 *   - No manual loading/error state management
 *   - Background refetching when data goes stale
 *   - Structural sharing prevents unnecessary re-renders
 *
 * Tab-switch optimization:
 *   When switching to a specific category, the placeholderData function
 *   synchronously extracts matching results from the cached "all" response.
 *   This avoids the race condition of useEffect-based seeding and ensures
 *   results appear instantly on tab switch.
 */
export function useSearchQuery(query: string, category: SearchCategory) {
  const queryClient = useQueryClient();

  // Synchronous placeholder: when switching to a specific category,
  // pull matching results from the cached "all" response immediately.
  // This runs during render (no useEffect delay) so tabs switch instantly.
  const getPlaceholder = useCallback((): SearchApiData | undefined => {
    // For "all" tab or empty query, fall back to keepPreviousData behavior
    if (category === "all" || !query) return undefined;

    // Try to extract from the cached "all" response for this query
    const allData = queryClient.getQueryData<SearchApiData>([
      "search",
      query,
      "all",
    ]);
    if (allData) {
      const extracted = extractCategoryFromAll(allData, category);
      if (extracted) return extracted;
    }

    // Fall back: check if there's any previous data for this exact key
    // (handles re-visiting a tab that was already fetched)
    return undefined;
  }, [category, query, queryClient]);

  const queryResult = useQuery<SearchApiData>({
    // Query key includes both query and category for proper cache separation
    queryKey: ["search", query, category] as const,

    // Avoid broad one-character searches; they are expensive and rarely useful.
    enabled: query.trim().length >= 2,

    queryFn: ({ signal }) => fetchSearchResults(query, category, signal),

    // Synchronous placeholder from "all" cache for instant tab switches.
    // Falls back to keepPreviousData when no "all" data is available.
    placeholderData: (previousData) => {
      // First try extracting from "all" cache (instant tab switch)
      const fromAll = getPlaceholder();
      if (fromAll) return fromAll;
      // Fall back to previous data for this observer (typing new query)
      return previousData;
    },

    // Cache configuration tuned to reduce repeated Apple Music lookups.
    staleTime: 30 * 60 * 1000,
    gcTime: 2 * 60 * 60 * 1000,

    // Don't refetch on window focus for search (user expects stable results)
    refetchOnWindowFocus: false,

    // Don't retry search failures aggressively
    retry: 1,
    retryDelay: 1000,
  });

  return queryResult;
}
