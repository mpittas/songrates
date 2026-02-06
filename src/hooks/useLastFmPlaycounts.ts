"use client";

import { useQuery } from "@tanstack/react-query";
import type { TrackInfo } from "@/types/music";

// ─── Fetcher ───────────────────────────────────────────────────────────────────

async function fetchLastFmPlaycounts(
  tracks: { title: string; artistName: string }[],
): Promise<Record<string, number>> {
  if (tracks.length === 0) return {};

  const apiKey = process.env.LASTFM_API_KEY;
  if (!apiKey) return {};

  const playcounts: Record<string, number> = {};

  // Process in batches to avoid rate limiting
  const batchSize = 5;
  for (let i = 0; i < tracks.length; i += batchSize) {
    const batch = tracks.slice(i, i + batchSize);

    const promises = batch.map(async (track) => {
      try {
        const url = `http://ws.audioscrobbler.com/2.0/?method=track.getInfo&artist=${encodeURIComponent(
          track.artistName,
        )}&track=${encodeURIComponent(track.title)}&api_key=${apiKey}&format=json`;

        const res = await fetch(url, { next: { revalidate: 1800 } });
        if (!res.ok) return;

        const data = await res.json();
        const playcount = parseInt(data?.track?.playcount, 10);
        if (playcount > 0) {
          // Find the track by title and artist name to get its ID
          playcounts[track.title] = playcount;
        }
      } catch (err) {
        // Silently fail - playcount is optional enrichment
      }
    });

    await Promise.all(promises);

    // Small delay between batches
    if (i + batchSize < tracks.length) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }

  return playcounts;
}

// ─── Hook ──────────────────────────────────────────────────────────────────────

/**
 * Fetches Last.fm playcounts for all tracks in an album.
 *
 * @param tracks - Album tracks with title and artistName
 * @returns Map of track title → playcount
 */
export function useLastFmPlaycounts(tracks: TrackInfo[]) {
  const trackData = tracks.map((t) => ({
    title: t.title,
    artistName: t.artistName || "",
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
