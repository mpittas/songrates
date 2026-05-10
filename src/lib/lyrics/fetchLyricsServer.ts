/**
 * Server-side lyrics fetchers (no "use client"). Used by /api/lyrics.
 */

export interface LyricsData {
  lyrics: string | null;
  syncedLyrics: string | null;
}

const LRCLIB_BASE = "https://lrclib.net/api";

const UA = { "User-Agent": "songrates/1.0.0" };

async function fetchLrclib(
  trackName: string,
  artistName: string,
  durationMs: number | undefined,
  signal: AbortSignal | undefined,
): Promise<LyricsData> {
  const empty: LyricsData = { lyrics: null, syncedLyrics: null };

  const params = new URLSearchParams({
    track_name: trackName,
    artist_name: artistName,
  });
  if (durationMs) {
    params.set("duration", String(Math.round(durationMs / 1000)));
  }

  const searchParams = new URLSearchParams({
    track_name: trackName,
    artist_name: artistName,
  });

  try {
    const searchPromise = fetch(`${LRCLIB_BASE}/search?${searchParams}`, {
      headers: UA,
      signal,
      next: { revalidate: 3600 },
    });

    const getRes = await fetch(`${LRCLIB_BASE}/get?${params}`, {
      headers: UA,
      signal,
      next: { revalidate: 3600 },
    });

    if (getRes.ok) {
      const data = await getRes.json();
      return {
        lyrics: data.plainLyrics || null,
        syncedLyrics: data.syncedLyrics || null,
      };
    }

    const searchRes = await searchPromise;
    if (searchRes.ok) {
      const results = await searchRes.json();
      if (Array.isArray(results) && results.length > 0) {
        return {
          lyrics: results[0].plainLyrics || null,
          syncedLyrics: results[0].syncedLyrics || null,
        };
      }
    }
  } catch {
    /* aborted / network */
  }

  return empty;
}

async function fetchLyricsOvh(
  trackName: string,
  artistName: string,
  signal: AbortSignal | undefined,
): Promise<LyricsData> {
  const empty: LyricsData = { lyrics: null, syncedLyrics: null };
  try {
    const url = `https://api.lyrics.ovh/v1/${encodeURIComponent(artistName)}/${encodeURIComponent(trackName)}`;
    const res = await fetch(url, {
      signal,
      next: { revalidate: 3600 },
    });
    if (!res.ok) return empty;
    const data = (await res.json()) as { lyrics?: string };
    const text = typeof data.lyrics === "string" ? data.lyrics.trim() : "";
    if (!text) return empty;
    return { lyrics: text, syncedLyrics: null };
  } catch {
    return empty;
  }
}

/**
 * Return the first provider that yields non-empty plain lyrics; otherwise empty.
 * Runs both in parallel so whichever is faster wins when both have data.
 */
export async function fetchLyricsFirstAvailable(
  trackName: string,
  artistName: string,
  durationMs: number | undefined,
  signal?: AbortSignal,
): Promise<LyricsData> {
  const t = trackName.trim();
  const a = artistName.trim();
  const empty: LyricsData = { lyrics: null, syncedLyrics: null };
  if (!t || !a) return empty;

  return new Promise((resolve) => {
    let settled = false;
    let remaining = 2;

    const finish = (data: LyricsData) => {
      if (settled) return;
      if (data.lyrics) {
        settled = true;
        resolve(data);
        return;
      }
      remaining -= 1;
      if (remaining === 0) {
        settled = true;
        resolve(empty);
      }
    };

    fetchLrclib(t, a, durationMs, signal)
      .then(finish)
      .catch(() => finish(empty));

    fetchLyricsOvh(t, a, signal)
      .then(finish)
      .catch(() => finish(empty));
  });
}
