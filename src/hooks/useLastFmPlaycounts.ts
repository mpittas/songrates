"use client";

import { useQuery } from "@tanstack/react-query";
import type { TrackInfo } from "@/types/music";

// ─── Fetcher ───────────────────────────────────────────────────────────────────

async function fetchLastFmPlaycounts(
  tracks: { title: string; artistName: string }[],
): Promise<Record<string, number>> {
  if (tracks.length === 0) return {};

  try {
    const res = await fetch("/api/lastfm/track-popularity", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tracks }),
    });

    if (!res.ok) return {};
    return await res.json();
  } catch {
    return {};
  }
}

// ─── Hook ──────────────────────────────────────────────────────────────────────

/**
 * Fetches Last.fm playcounts for all tracks in an album.
 *
 * @param tracks - Album tracks with title and artistName
 * @returns Map of track title → playcount
 */
export function useLastFmPlaycounts(
  tracks: TrackInfo[],
  albumArtistName?: string,
) {
  const trackData = tracks.map((t) => ({
    title: t.title,
    artistName: t.artistName || albumArtistName || "",
  }));

  return useQuery<Record<string, number>>({
    queryKey: ["lastfm-playcounts", trackData] as const,

    enabled: trackData.length > 0,

    queryFn: () => fetchLastFmPlaycounts(trackData),

    staleTime: 10 * 60 * 1000, // 10 min
    gcTime: 60 * 60 * 1000, // 1 hour

    refetchOnWindowFocus: false,
    retry: false,

    placeholderData: {},
  });
}
