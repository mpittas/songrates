import { NextRequest } from "next/server";
import { youtubeCache } from "@/lib/cache";
import { successResponse, CACHE_HEADERS } from "@/lib/api-utils";

const YOUTUBE_CACHE_HEADERS = {
  "Cache-Control":
    "public, s-maxage=86400, stale-while-revalidate=604800",
};

const YOUTUBE_SEARCH_URL = "https://www.youtube.com/results";

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q");

  if (!query) {
    return successResponse({ videoId: null, error: "Missing query" }, "search");
  }

  // Check cache first for instant response
  const cacheKey = query.toLowerCase().trim();
  const cachedVideoId = youtubeCache.get(cacheKey);
  if (cachedVideoId) {
    return successResponse(
      {
        videoId: cachedVideoId,
        success: true,
        cached: true,
      },
      "search",
      YOUTUBE_CACHE_HEADERS,
    );
  }

  try {
    // Fetch YouTube search results page
    const res = await fetch(
      `${YOUTUBE_SEARCH_URL}?search_query=${encodeURIComponent(query)}`,
      {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        },
      },
    );

    const html = await res.text();

    // Extract video ID from the search results
    const videoIdMatch = html.match(/\/watch\?v=([a-zA-Z0-9_-]{11})/);

    if (videoIdMatch?.[1]) {
      const videoId = videoIdMatch[1];
      youtubeCache.set(cacheKey, videoId);

      return successResponse({ videoId, success: true }, "search", YOUTUBE_CACHE_HEADERS);
    }

    return successResponse({ videoId: null, success: false }, "search");
  } catch (e) {
    console.error("YouTube search error:", e);
    return successResponse({ videoId: null, success: false }, "search");
  }
}
