"use client";

import { useQuery } from "@tanstack/react-query";

interface LyricsData {
  lyrics: string | null;
  syncedLyrics: string | null;
}

const LRCLIB_BASE = "https://lrclib.net/api";

/**
 * Fetch lyrics directly from lrclib.net (CORS-enabled, no API key).
 * Tries exact /get first (fastest), falls back to /search.
 */
async function fetchLyrics(
  trackName: string,
  artistName: string,
  durationMs?: number,
): Promise<LyricsData> {
  const empty: LyricsData = { lyrics: null, syncedLyrics: null };

  // 1. Try exact match (fastest endpoint)
  const params = new URLSearchParams({
    track_name: trackName,
    artist_name: artistName,
  });
  if (durationMs) {
    params.set("duration", String(Math.round(durationMs / 1000)));
  }

  try {
    const res = await fetch(`${LRCLIB_BASE}/get?${params}`, {
      headers: { "User-Agent": "songrates/1.0.0" },
    });

    if (res.ok) {
      const data = await res.json();
      return {
        lyrics: data.plainLyrics || null,
        syncedLyrics: data.syncedLyrics || null,
      };
    }

    // 2. Fallback: search endpoint (broader matching)
    if (res.status === 404) {
      const searchParams = new URLSearchParams({
        track_name: trackName,
        artist_name: artistName,
      });
      const searchRes = await fetch(`${LRCLIB_BASE}/search?${searchParams}`, {
        headers: { "User-Agent": "songrates/1.0.0" },
      });

      if (searchRes.ok) {
        const results = await searchRes.json();
        if (results?.length > 0) {
          return {
            lyrics: results[0].plainLyrics || null,
            syncedLyrics: results[0].syncedLyrics || null,
          };
        }
      }
    }
  } catch {
    // Network error — return empty
  }

  return empty;
}

/**
 * Fetches lyrics on demand (enabled = true when user expands the lyrics panel).
 * Calls lrclib.net directly from the browser (CORS-enabled) — no server hop.
 * Uses react-query for caching — subsequent opens are instant.
 */
export function useLyrics(
  trackName: string,
  artistName: string,
  durationMs?: number,
  enabled = false,
) {
  return useQuery<LyricsData>({
    queryKey: ["lyrics", trackName, artistName],
    queryFn: () => fetchLyrics(trackName, artistName, durationMs),
    enabled,
    staleTime: 60 * 60 * 1000, // 1 hour
    gcTime: 24 * 60 * 60 * 1000, // 24 hours
    refetchOnWindowFocus: false,
    retry: 1,
  });
}
