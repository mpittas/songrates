import { NextRequest, NextResponse } from "next/server";

// ─── Cover Art Archive (primary) + Deezer (fallback) ────────────────────────────
// CAA has NO rate limits (https://wiki.musicbrainz.org/Cover_Art_Archive/API).
// archive.org CDN returns 401 on direct browser requests (hotlink protection),
// so we proxy bytes server-side with a proper User-Agent.
//
// Fallback: Deezer API (free, no auth, works server-side).
// iTunes is NOT used — Apple blocks server-side requests with 403.
//
// Strategy: Try CAA first (best database). If CAA returns 404 and we have
// title+artist, fall back to Deezer immediately. Deezer CDN images are
// fetched directly (no hotlink issues) so we redirect instead of proxying.

type ImageResult = { buffer: ArrayBuffer; contentType: string; source: string };

const IMAGE_CACHE = new Map<
  string,
  { buffer: ArrayBuffer; contentType: string; timestamp: number }
>();
// Cache Deezer redirect URLs (lightweight — just strings)
const URL_CACHE = new Map<string, { url: string; timestamp: number }>();
// Cache 404s so we don't re-fetch known missing art every page load
const NEGATIVE_CACHE = new Map<string, number>();
const CACHE_TTL = 86400 * 1000; // 24 hours
const NEGATIVE_TTL = 3600 * 1000; // 1 hour for 404s
const IN_FLIGHT = new Map<string, Promise<Response>>();
const USER_AGENT = "SongRates/1.0 (mpittas@gmail.com)";
const CACHE_HEADERS = {
  "Cache-Control":
    "public, max-age=86400, s-maxage=604800, stale-while-revalidate=2592000",
};

async function fetchFromCAA(
  releaseGroupId: string,
): Promise<ImageResult | null> {
  try {
    // CAA /release-group/{id}/front-250 → 307 redirect → archive.org image
    const res = await fetch(
      `https://coverartarchive.org/release-group/${releaseGroupId}/front-250`,
      {
        headers: { "User-Agent": USER_AGENT },
        signal: AbortSignal.timeout(6000),
      },
    );

    if (res.status === 404) {
      NEGATIVE_CACHE.set(`caa:${releaseGroupId}`, Date.now());
      return null;
    }

    if (!res.ok) return null;

    const contentType = res.headers.get("content-type") || "image/jpeg";
    const buffer = await res.arrayBuffer();

    return { buffer, contentType, source: "CAA" };
  } catch (err) {
    console.log(
      `[CAA] Error for ${releaseGroupId}:`,
      err instanceof Error ? err.message : "unknown",
    );
    return null;
  }
}

async function fetchDeezerUrl(
  title: string,
  artist: string,
): Promise<string | null> {
  try {
    const query = encodeURIComponent(`${title} ${artist}`);
    const res = await fetch(
      `https://api.deezer.com/search/album?q=${query}&limit=1`,
      { signal: AbortSignal.timeout(4000) },
    );

    if (!res.ok) return null;

    const data = await res.json();
    const cover = data.data?.[0]?.cover_big || data.data?.[0]?.cover_medium;
    return cover || null;
  } catch {
    return null;
  }
}

function evictCacheIfNeeded() {
  if (IMAGE_CACHE.size > 200) {
    const oldest = [...IMAGE_CACHE.entries()]
      .sort((a, b) => a[1].timestamp - b[1].timestamp)
      .slice(0, 50);
    for (const [key] of oldest) IMAGE_CACHE.delete(key);
  }
}

function makeImageResponse(result: ImageResult): NextResponse {
  return new NextResponse(result.buffer, {
    status: 200,
    headers: { "Content-Type": result.contentType, ...CACHE_HEADERS },
  });
}

async function resolveImage(
  id: string,
  title: string | null,
  artist: string | null,
): Promise<Response> {
  const hasFallbackParams = !!(title && artist);

  // If CAA already returned 404 for this ID recently, skip straight to Deezer
  const negativeEntry = NEGATIVE_CACHE.get(`caa:${id}`);
  const caaCached404 =
    negativeEntry && Date.now() - negativeEntry < NEGATIVE_TTL;

  if (caaCached404 && hasFallbackParams) {
    const deezerUrl = await fetchDeezerUrl(title!, artist!);
    if (deezerUrl) {
      URL_CACHE.set(id, { url: deezerUrl, timestamp: Date.now() });
      return NextResponse.redirect(deezerUrl, {
        status: 302,
        headers: CACHE_HEADERS,
      });
    }
    return new NextResponse(null, { status: 404 });
  }

  // 1. Try Cover Art Archive (primary — no rate limits, best database)
  const caaResult = await fetchFromCAA(id);
  if (caaResult) {
    IMAGE_CACHE.set(id, {
      buffer: caaResult.buffer,
      contentType: caaResult.contentType,
      timestamp: Date.now(),
    });
    evictCacheIfNeeded();
    return makeImageResponse(caaResult);
  }

  // 2. Fallback: Deezer (needs title+artist)
  //    Deezer CDN has no hotlink protection, so we redirect (fast, no proxy)
  if (hasFallbackParams) {
    const deezerUrl = await fetchDeezerUrl(title!, artist!);
    if (deezerUrl) {
      URL_CACHE.set(id, { url: deezerUrl, timestamp: Date.now() });
      return NextResponse.redirect(deezerUrl, {
        status: 302,
        headers: CACHE_HEADERS,
      });
    }
  }

  return new NextResponse(null, { status: 404 });
}

export async function GET(request: NextRequest) {
  const id = request.nextUrl.searchParams.get("id");
  const title = request.nextUrl.searchParams.get("title");
  const artist = request.nextUrl.searchParams.get("artist");

  if (!id) {
    return new NextResponse(null, { status: 400 });
  }

  // Check in-memory image cache — instant response (CAA proxied bytes)
  const cached = IMAGE_CACHE.get(id);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return new NextResponse(cached.buffer, {
      status: 200,
      headers: { "Content-Type": cached.contentType, ...CACHE_HEADERS },
    });
  }

  // Check URL cache — instant redirect (Deezer CDN URLs)
  const urlCached = URL_CACHE.get(id);
  if (urlCached && Date.now() - urlCached.timestamp < CACHE_TTL) {
    return NextResponse.redirect(urlCached.url, {
      status: 302,
      headers: CACHE_HEADERS,
    });
  }

  // Check negative cache — instant 404 (no art anywhere)
  const negEntry = NEGATIVE_CACHE.get(`caa:${id}`);
  if (negEntry && Date.now() - negEntry < NEGATIVE_TTL && !title && !artist) {
    return new NextResponse(null, { status: 404 });
  }

  // Dedup concurrent requests for the same ID
  let inflight = IN_FLIGHT.get(id);
  if (!inflight) {
    inflight = resolveImage(id, title, artist);
    IN_FLIGHT.set(id, inflight);
  }

  try {
    const response = await inflight;
    return response.clone();
  } finally {
    IN_FLIGHT.delete(id);
  }
}
