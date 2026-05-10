import { NextRequest, NextResponse } from "next/server";

import { fetchLyricsFirstAvailable } from "@/lib/lyrics/fetchLyricsServer";

/** Browser + CDN cache: repeat lookups are fast; origin still revalidates via Next fetch cache. */
const CACHE_CONTROL =
  "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800";

export async function GET(request: NextRequest) {
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
      { status: 400 },
    );
  }

  const data = await fetchLyricsFirstAvailable(track, artist, durationMs);

  return NextResponse.json(data, {
    headers: { "Cache-Control": CACHE_CONTROL },
  });
}
