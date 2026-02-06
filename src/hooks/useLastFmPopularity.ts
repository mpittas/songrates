"use client";

import { useQuery } from "@tanstack/react-query";

async function fetchLastFmCounts(
  artist: string,
): Promise<Record<string, number>> {
  if (!artist) return {};

  const res = await fetch("/api/lastfm/track-popularity", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ artist }),
  });

  if (!res.ok) return {};

  const data = await res.json();
  return data.counts || {};
}

/**
 * Fetches Last.fm listener counts for an album's tracks by fetching the artist's top tracks.
 * Returns a map of normalized track title -> listener count.
 */
export function useLastFmPopularity(
  artistName: string | undefined,
  initialData?: Record<string, number>,
) {
  const hasInitialData = initialData && Object.keys(initialData).length > 0;

  return useQuery<Record<string, number>>({
    queryKey: ["lastfm-popularity", artistName],
    enabled: !!artistName && !hasInitialData,
    queryFn: () => fetchLastFmCounts(artistName!),
    initialData: hasInitialData ? initialData : undefined,
    staleTime: 1000 * 60 * 60, // 1 hour
    gcTime: 1000 * 60 * 60 * 24, // 24 hours
    refetchOnWindowFocus: false,
    retry: false,
    placeholderData: {},
  });
}
