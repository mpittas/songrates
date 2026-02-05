import { NextRequest, NextResponse } from "next/server";
import { fetchListenBrainzCounts } from "@/lib/searchService";
import { CACHE_HEADERS } from "@/lib/api-utils";

export const dynamic = "force-dynamic";

/**
 * POST /api/search/enrich
 *
 * Lazy enrichment endpoint — fetches ListenBrainz listen counts
 * for a batch of recording MBIDs. Called AFTER main search results
 * are already displayed to avoid blocking the initial response.
 *
 * Body: { "mbids": ["mbid1", "mbid2", ...] }  (max 10)
 * Returns: { "counts": { "mbid1": 12345, "mbid2": 678 } }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const mbids: string[] = body?.mbids;

    if (!Array.isArray(mbids) || mbids.length === 0) {
      return NextResponse.json({ counts: {} });
    }

    // Limit to 10 to prevent abuse
    const limited = mbids.slice(0, 10);
    const counts = await fetchListenBrainzCounts(limited);

    return NextResponse.json({ counts }, { headers: CACHE_HEADERS.search });
  } catch (error) {
    console.error("Enrich API error:", error);
    return NextResponse.json({ counts: {} });
  }
}
