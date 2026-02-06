"use client";

import { useQuery } from "@tanstack/react-query";
import type { TrackInfo } from "@/types/music";

// ─── Fetcher ───────────────────────────────────────────────────────────────────

async function fetchPopularityCounts(
  recordingMbids: string[],
): Promise<Record<string, number>> {
  if (recordingMbids.length === 0) return {};

  const res = await fetch("/api/listenbrainz/popularity", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ recording_mbids: recordingMbids }),
  });

  if (!res.ok) return {};

  const data = await res.json();
  return data.counts || {};
}

// ─── Hook ──────────────────────────────────────────────────────────────────────

/**
 * TanStack React Query hook for fetching ListenBrainz total listen counts
 * for all tracks in an album tracklist.
 *
 * Performance optimizations:
 *   - Single batch request for all tracks (not per-track)
 *   - Keyed by sorted recording MBIDs for stable cache hits
 *   - Aggressive caching: 10 min staleTime, 1 hour gcTime
 *   - Non-blocking: album page renders immediately, counts appear when ready
 *   - Only fires when tracks with recording IDs are available
 *
 * @param tracks - Album tracks (must include recordingId from MusicBrainz)
 * @returns Map of recordingId → total listen count
 */
export function useListenBrainzPopularity(tracks: TrackInfo[]) {
  // Extract recording MBIDs (filter out tracks without recording IDs)
  const recordingMbids = tracks
    .map((t) => t.recordingId)
    .filter((id): id is string => !!id);

  // Sort for stable query key (order doesn't matter for the API)
  const sortedMbids = [...recordingMbids].sort();

  return useQuery<Record<string, number>>({
    queryKey: ["listenbrainz-popularity", sortedMbids] as const,

    // Only fetch when we have recording MBIDs
    enabled: recordingMbids.length > 0,

    queryFn: () => fetchPopularityCounts(recordingMbids),

    // Listen counts are stable — cache aggressively
    staleTime: 10 * 60 * 1000, // 10 min fresh
    gcTime: 60 * 60 * 1000, // 1 hour in memory

    // Don't refetch on window focus (counts don't change that fast)
    refetchOnWindowFocus: false,

    // Don't retry — enrichment is optional, not critical
    retry: false,

    // Return empty object as placeholder while loading
    placeholderData: {},
  });
}
