import { NextRequest, NextResponse } from "next/server";
import { CACHE_HEADERS } from "@/lib/api-utils";
import { searchCache } from "@/lib/cache";

const LISTENBRAINZ_BASE_URL = "https://api.listenbrainz.org/1";
const USER_AGENT = "SongRates/1.0 (mpittas@gmail.com)";

/**
 * POST /api/listenbrainz/popularity
 *
 * Fetches total listen counts from ListenBrainz for a batch of recording MBIDs.
 * Designed for album tracklist enrichment — supports up to 50 MBIDs per request.
 *
 * Body: { "recording_mbids": ["mbid1", "mbid2", ...] }
 * Returns: { "counts": { "mbid1": 12345, "mbid2": 678 } }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const mbids: string[] = body?.recording_mbids;

    if (!Array.isArray(mbids) || mbids.length === 0) {
      return NextResponse.json({ counts: {} });
    }

    // Limit to 50 to prevent abuse (most albums have < 30 tracks)
    const limited = mbids.slice(0, 50);

    // Check cache first (sorted key for stability)
    const cacheKey = `lb-pop:${[...limited].sort().join(",")}`;
    const cached = searchCache.get(cacheKey);
    if (cached) {
      return NextResponse.json(
        { counts: cached },
        { headers: CACHE_HEADERS.album },
      );
    }

    const res = await fetch(`${LISTENBRAINZ_BASE_URL}/popularity/recording`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": USER_AGENT,
      },
      body: JSON.stringify({ recording_mbids: limited }),
    });

    if (!res.ok) {
      return NextResponse.json({ counts: {} });
    }

    const data = await res.json();
    const counts: Record<string, number> = {};

    const items = Array.isArray(data)
      ? data
      : Array.isArray(data?.payload)
        ? data.payload
        : [];

    for (const entry of items) {
      if (
        entry.recording_mbid &&
        typeof entry.total_listen_count === "number"
      ) {
        counts[entry.recording_mbid] = entry.total_listen_count;
      }
    }

    // Cache for 1 hour (listen counts change slowly)
    searchCache.set(cacheKey, counts, 3600);

    return NextResponse.json({ counts }, { headers: CACHE_HEADERS.album });
  } catch (error) {
    console.error("ListenBrainz popularity API error:", error);
    return NextResponse.json({ counts: {} });
  }
}
