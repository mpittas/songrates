"use client";

import { useQuery } from "@tanstack/react-query";
import type { SongSearchResult } from "@/types/search";

// ─── Fetcher ───────────────────────────────────────────────────────────────────

async function fetchListenCounts(
  mbids: string[],
): Promise<Record<string, number>> {
  if (mbids.length === 0) return {};

  const res = await fetch("/api/search/enrich", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ mbids }),
  });

  if (!res.ok) return {};

  const data = await res.json();
  return data.counts || {};
}

// ─── Hook ──────────────────────────────────────────────────────────────────────

/**
 * TanStack React Query hook for lazy ListenBrainz enrichment.
 *
 * Fires AFTER main search results are rendered. Enriches songs with listen
 * counts for popularity re-ranking. Non-blocking — the UI shows results
 * immediately and listen counts appear when ready.
 *
 * Benefits:
 *   - Automatic caching: same song MBIDs won't be re-fetched
 *   - Deduplication: concurrent identical requests are merged
 *   - Longer gcTime (1 hour) since listen counts change slowly
 *   - `enabled` guard prevents firing when there are no songs
 */
export function useSearchEnrich(songs: SongSearchResult[]) {
  // Only enrich the first 10 songs (API limit)
  const mbids = songs.slice(0, 10).map((s) => s.id);

  // Sort MBIDs for stable query key (order shouldn't matter for cache)
  const sortedMbids = [...mbids].sort();

  return useQuery<Record<string, number>>({
    queryKey: ["search-enrich", sortedMbids] as const,

    // Only fetch when we have song MBIDs to enrich
    enabled: mbids.length > 0,

    queryFn: () => fetchListenCounts(mbids),

    // Listen counts are stable — cache aggressively
    staleTime: 10 * 60 * 1000, // 10 min fresh
    gcTime: 60 * 60 * 1000, // 1 hour in memory

    // Don't refetch on window focus
    refetchOnWindowFocus: false,

    // Don't retry — enrichment is optional
    retry: false,
  });
}
