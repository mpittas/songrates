import { NextRequest } from "next/server";

import { youtubeCache } from "@/lib/cache";
import { createApiTimer, successResponse } from "@/lib/api-utils";

const YOUTUBE_CACHE_HEADERS = {
  // YouTube search results change rarely for a given query — a week of edge
  // cache + SWR keeps the per-track-play scrape cost near zero for warm
  // queries while still letting new uploads surface eventually.
  "Cache-Control": "public, s-maxage=604800, stale-while-revalidate=1209600",
};

const YOUTUBE_SEARCH_URL = "https://www.youtube.com/results";

// YouTube increasingly returns consent/cookie redirects to scraper User-Agents,
// which surfaces as "redirect count exceeded" in the runtime logs. Surface a
// clean error instead of hanging the fn.
const FETCH_TIMEOUT_MS = 8000;

export async function GET(request: NextRequest) {
  const timer = createApiTimer();
  const query = request.nextUrl.searchParams.get("q");

  if (!query) {
    return successResponse(
      { videoId: null, error: "Missing query" },
      "search",
      timer.headers(),
    );
  }

  // Check cache first for instant response
  const cacheKey = query.toLowerCase().trim();
  const cachedVideoId = youtubeCache.get(cacheKey);
  if (cachedVideoId) {
    return successResponse(
      { videoId: cachedVideoId, success: true, cached: true },
      "search",
      timer.headers({ ...YOUTUBE_CACHE_HEADERS, "X-Cache": "HIT" }),
    );
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(
      () => controller.abort(),
      FETCH_TIMEOUT_MS,
    );

    let res: Response;
    try {
      res = await timer.measure("youtube_search", () =>
        fetch(
          `${YOUTUBE_SEARCH_URL}?search_query=${encodeURIComponent(query)}`,
          {
            headers: {
              "User-Agent":
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
              "Accept-Language": "en-US,en;q=0.9",
            },
            redirect: "follow",
            signal: controller.signal,
          },
        ),
      );
    } finally {
      clearTimeout(timeout);
    }

    // Guard against redirect loops / consent walls. fetch throws on
    // too many redirects, but a 3xx final state also means no usable body.
    if (!res.ok || res.status >= 300) {
      console.warn(
        `YouTube search non-200 (${res.status}) for query: ${query}`,
      );
      return successResponse(
        { videoId: null, success: false, reason: "upstream_status" },
        "search",
        // Short s-maxage so we don't cache failure for a week.
        timer.headers({
          "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
          "X-Cache": "MISS",
        }),
      );
    }

    const html = await timer.measure("youtube_parse", () => res.text());

    // Extract video ID from the search results. Prefer the watch URL pattern;
    // fall back to the ytInitialData renderer watchEndpoint if absent.
    const videoIdMatch =
      html.match(/\/watch\?v=([a-zA-Z0-9_-]{11})/) ||
      html.match(/"videoId":"([a-zA-Z0-9_-]{11})"/);

    if (videoIdMatch?.[1]) {
      const videoId = videoIdMatch[1];
      youtubeCache.set(cacheKey, videoId);

      return successResponse(
        { videoId, success: true },
        "search",
        timer.headers({ ...YOUTUBE_CACHE_HEADERS, "X-Cache": "MISS" }),
      );
    }

    return successResponse(
      { videoId: null, success: false, reason: "no_match" },
      "search",
      timer.headers({
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
        "X-Cache": "MISS",
      }),
    );
  } catch (e: unknown) {
    const error = e as {
      name?: string;
      message?: string;
      cause?: { message?: string };
    };
    // Distinguish abort vs other failures so logs are actionable.
    const reason =
      error.name === "AbortError"
        ? "timeout"
        : (error.cause?.message ?? error.message ?? "fetch_failed");
    console.error(`YouTube search error (${reason}) for query: ${query}`, e);
    return successResponse(
      { videoId: null, success: false, reason },
      "search",
      timer.headers({
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
        "X-Cache": "MISS",
      }),
    );
  }
}

// Ensure the runtime treats this as a Node.js function (not edge) so the
// 8s AbortController has a sane default budget. Static config avoids
// accidental edge deployment.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
