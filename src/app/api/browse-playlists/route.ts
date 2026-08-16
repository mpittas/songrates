import { NextRequest, NextResponse } from "next/server";

import { CACHE_HEADERS, createApiTimer } from "@/lib/api-utils";
import { searchCatalogPlaylists } from "@/lib/appleMusic/api";

/**
 * GET /api/browse-playlists?q=chicago%20blues
 * Playlist search for a genre/style term (used by Genres subgenre chips).
 */
export async function GET(request: NextRequest) {
  const timer = createApiTimer();
  const q = request.nextUrl.searchParams.get("q")?.trim() ?? "";

  if (q.length < 2 || q.length > 80) {
    return NextResponse.json(
      { error: "Invalid or missing query." },
      { status: 400 },
    );
  }

  const playlists = await timer.measure("browse_playlists", () =>
    searchCatalogPlaylists(q, undefined, 12),
  );

  return NextResponse.json(
    { playlists },
    { headers: timer.headers(CACHE_HEADERS.playlist) },
  );
}
