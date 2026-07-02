import { NextRequest, NextResponse } from "next/server";

import { createApiTimer } from "@/lib/api-utils";
import { fetchLyricsFirstAvailable } from "@/lib/lyrics/fetchLyricsServer";

/** Browser + CDN cache: repeat lookups are fast; origin still revalidates via Next fetch cache. */
const CACHE_CONTROL =
  "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800";

export async function GET(request: NextRequest) {
  const timer = createApiTimer();
  const { searchParams } = new URL(request.url);
  const track = searchParams.get("track") ?? "";
  const artist = searchParams.get("artist") ?? "";
  const durationSec = searchParams.get("durationSec");
  const durationMs =
    durationSec && !Number.isNaN(Number(durationSec))
      ? Math.round(Number(durationSec) * 1000)
      : undefined;

  if (!track.trim() || !artist.trim()) {
    return NextResponse.json(
      { lyrics: null, syncedLyrics: null },
      { status: 400, headers: timer.headers() },
    );
  }

  const data = await timer.measure("lyrics_fetch", () =>
    fetchLyricsFirstAvailable(track, artist, durationMs),
  );

  return NextResponse.json(data, {
    headers: timer.headers({ "Cache-Control": CACHE_CONTROL }),
  });
}
