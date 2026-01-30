import { NextRequest, NextResponse } from "next/server";
import { youtubeCache } from "@/lib/cache";

const YOUTUBE_SEARCH_URL = "https://www.youtube.com/results";

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q");

  if (!query) {
    return NextResponse.json({ videoId: null, error: "Missing query" });
  }

  // Check cache first for instant response
  const cacheKey = query.toLowerCase().trim();
  const cachedVideoId = youtubeCache.get(cacheKey);
  if (cachedVideoId) {
    return NextResponse.json({
      videoId: cachedVideoId,
      success: true,
      cached: true,
    });
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
    // YouTube embeds video data in the page - look for the first video result
    const videoIdMatch = html.match(/\/watch\?v=([a-zA-Z0-9_-]{11})/);

    if (videoIdMatch && videoIdMatch[1]) {
      const videoId = videoIdMatch[1];

      // Cache the result for faster future lookups
      youtubeCache.set(cacheKey, videoId);

      return NextResponse.json({
        videoId,
        success: true,
      });
    }

    return NextResponse.json({ videoId: null, success: false });
  } catch (e) {
    console.error("YouTube search error:", e);
    return NextResponse.json({ videoId: null, success: false });
  }
}
