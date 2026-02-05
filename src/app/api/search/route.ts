import { NextRequest, NextResponse } from "next/server";
import {
  searchMusicBrainz,
  isValidQuery,
  isValidCategory,
} from "@/lib/searchService";
import type { SearchCategory, SearchApiResponse } from "@/types/search";
import { CACHE_HEADERS } from "@/lib/api-utils";

export const dynamic = "force-dynamic";

/**
 * GET /api/search?q=hello&category=song
 *
 * Query params:
 *   q        (required)  Search query string
 *   category (optional)  "all" | "artist" | "album" | "song" — defaults to "all"
 *
 * Returns: SearchApiResponse
 */
export async function GET(request: NextRequest) {
  const start = performance.now();
  const searchParams = request.nextUrl.searchParams;
  const q = searchParams.get("q");
  const categoryParam = searchParams.get("category") || "all";

  // ─── Validate query ────────────────────────────────────────────────
  if (!q || !isValidQuery(q)) {
    return NextResponse.json(
      {
        error:
          "Invalid or missing search query. Provide a non-empty 'q' parameter.",
      },
      { status: 400 },
    );
  }

  // ─── Validate category ─────────────────────────────────────────────
  if (!isValidCategory(categoryParam)) {
    return NextResponse.json(
      {
        error:
          "Invalid category. Must be one of: 'all', 'artist', 'album', 'song'.",
      },
      { status: 400 },
    );
  }

  const category = categoryParam as SearchCategory;

  try {
    const { results, grouped } = await searchMusicBrainz(q, category);
    const took = Math.round(performance.now() - start);

    const response: SearchApiResponse = {
      results,
      meta: {
        query: q,
        category,
        totalResults: results.length,
        took,
      },
    };

    // If "all", also include grouped results for the UI to use
    const body = grouped ? { ...response, grouped } : response;

    return NextResponse.json(body, {
      headers: CACHE_HEADERS.search,
    });
  } catch (error) {
    console.error("Search API error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
