import { NextRequest, NextResponse } from "next/server";

const YOUTUBE_SEARCH_URL = "https://www.youtube.com/results";

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q");

  if (!query) {
    return NextResponse.json({ videoId: null, error: "Missing query" });
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
      return NextResponse.json({
        videoId: videoIdMatch[1],
        success: true,
      });
    }

    return NextResponse.json({ videoId: null, success: false });
  } catch (e) {
    console.error("YouTube search error:", e);
    return NextResponse.json({ videoId: null, success: false });
  }
}
