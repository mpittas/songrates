"use client";

import {
  useQuery,
  type QueryFunctionContext,
  type UseQueryResult,
} from "@tanstack/react-query";

interface LyricsData {
  lyrics: string | null;
  syncedLyrics: string | null;
}

/**
 * Lyrics via same-origin API: races LRCLIB + lyrics.ovh on the server, CDN-cached responses.
 */
async function fetchLyrics(
  trackName: string,
  artistName: string,
  durationMs?: number,
  signal?: AbortSignal,
): Promise<LyricsData> {
  const empty: LyricsData = { lyrics: null, syncedLyrics: null };

  const t = trackName.trim();
  const a = artistName.trim();
  if (!t || !a) return empty;

  const params = new URLSearchParams({ track: t, artist: a });
  if (durationMs) {
    params.set("durationSec", String(Math.round(durationMs / 1000)));
  }

  try {
    const res = await fetch(`/api/lyrics?${params}`, { signal });
    if (!res.ok) return empty;
    return (await res.json()) as LyricsData;
  } catch {
    return empty;
  }
}

const LYRICS_STALE_MS = 60 * 60 * 1000;
const LYRICS_GC_MS = 24 * 60 * 60 * 1000;

export function lyricsQueryOptions(
  trackName: string,
  artistName: string,
  durationMs?: number,
) {
  return {
    queryKey: ["lyrics", trackName, artistName, durationMs ?? null] as const,
    queryFn: ({ signal }: QueryFunctionContext) =>
      fetchLyrics(trackName, artistName, durationMs, signal),
    staleTime: LYRICS_STALE_MS,
    gcTime: LYRICS_GC_MS,
    refetchOnWindowFocus: false as const,
    retry: false as const,
  };
}

/**
 * Fetches lyrics on demand (enabled = true when user expands the lyrics panel).
 * Uses react-query for caching — subsequent opens are instant.
 */
export function useLyrics(
  trackName: string,
  artistName: string,
  durationMs?: number,
  enabled = false,
): UseQueryResult<LyricsData, Error> {
  return useQuery<LyricsData, Error>({
    ...lyricsQueryOptions(trackName, artistName, durationMs),
    enabled,
  });
}
