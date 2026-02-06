import { NextRequest, NextResponse } from "next/server";

// ─── Cover Art Archive (primary) + iTunes (fallback) ────────────────────────────
// CAA has NO rate limits (https://wiki.musicbrainz.org/Cover_Art_Archive/API).
// archive.org CDN returns 401 on direct browser requests (hotlink protection),
// so we proxy bytes server-side with a proper User-Agent.
//
// Strategy: Start CAA immediately. If title+artist are available, start iTunes
// after a short delay as a race fallback. Take whichever resolves first.
// This ensures fast loads even when archive.org is slow.

type ImageResult = { buffer: ArrayBuffer; contentType: string; source: string };

const IMAGE_CACHE = new Map<
  string,
  { buffer: ArrayBuffer; contentType: string; timestamp: number }
>();
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
      // Definitively no art — cache this to avoid re-fetching
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

async function fetchFromiTunes(
  title: string,
  artist: string,
): Promise<ImageResult | null> {
  try {
    const query = encodeURIComponent(`${title} ${artist}`);
    const searchRes = await fetch(
      `https://itunes.apple.com/search?term=${query}&entity=album&limit=1`,
      { signal: AbortSignal.timeout(4000) },
    );

    if (!searchRes.ok) return null;

    const data = await searchRes.json();
    const artworkUrl = data.results?.[0]?.artworkUrl100;
    if (!artworkUrl) return null;

    const highResUrl = artworkUrl.replace("100x100bb", "600x600bb");
    const imgRes = await fetch(highResUrl, {
      signal: AbortSignal.timeout(5000),
    });

    if (!imgRes.ok) return null;

    const contentType = imgRes.headers.get("content-type") || "image/jpeg";
    const buffer = await imgRes.arrayBuffer();

    return { buffer, contentType, source: "iTunes" };
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
  const hasItunesParams = !!(title && artist);

  // If CAA already returned 404 for this ID recently, skip straight to iTunes
  const negativeEntry = NEGATIVE_CACHE.get(`caa:${id}`);
  const caaCached404 =
    negativeEntry && Date.now() - negativeEntry < NEGATIVE_TTL;

  if (caaCached404 && hasItunesParams) {
    const itunesResult = await fetchFromiTunes(title!, artist!);
    if (itunesResult) {
      IMAGE_CACHE.set(id, {
        buffer: itunesResult.buffer,
        contentType: itunesResult.contentType,
        timestamp: Date.now(),
      });
      evictCacheIfNeeded();
      return makeImageResponse(itunesResult);
    }
    return new NextResponse(null, { status: 404 });
  }

  // Race strategy: Start CAA immediately. If we have iTunes params, start
  // iTunes after 2s as a fallback race. Take whichever resolves first with data.
  if (hasItunesParams) {
    const result = await new Promise<ImageResult | null>((resolve) => {
      let settled = false;
      let caaFinished = false;
      let itunesFinished = false;
      let itunesStarted = false;

      const settleWith = (r: ImageResult | null) => {
        if (settled) return;
        // If we got a result, resolve immediately
        if (r) {
          settled = true;
          resolve(r);
          return;
        }
        // If both finished with no result, resolve null
        if (caaFinished && itunesFinished) {
          settled = true;
          resolve(null);
        }
      };

      // Start CAA immediately (primary)
      fetchFromCAA(id).then((r) => {
        caaFinished = true;
        if (r) {
          settleWith(r);
        } else if (!itunesStarted) {
          // CAA failed fast — start iTunes immediately, don't wait for 2s delay
          itunesStarted = true;
          fetchFromiTunes(title!, artist!).then((ir) => {
            itunesFinished = true;
            settleWith(ir);
          });
        } else {
          settleWith(null);
        }
      });

      // Start iTunes after 2s delay (gives CAA a head start)
      setTimeout(() => {
        if (!settled && !itunesStarted) {
          itunesStarted = true;
          fetchFromiTunes(title!, artist!).then((ir) => {
            itunesFinished = true;
            settleWith(ir);
          });
        }
      }, 2000);

      // Final safety timeout: resolve null after 10s total
      setTimeout(() => {
        if (!settled) {
          settled = true;
          resolve(null);
        }
      }, 10000);
    });

    if (result) {
      IMAGE_CACHE.set(id, {
        buffer: result.buffer,
        contentType: result.contentType,
        timestamp: Date.now(),
      });
      evictCacheIfNeeded();
      return makeImageResponse(result);
    }
  } else {
    // No iTunes params — CAA only
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

  // Check in-memory cache — instant response
  const cached = IMAGE_CACHE.get(id);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return new NextResponse(cached.buffer, {
      status: 200,
      headers: { "Content-Type": cached.contentType, ...CACHE_HEADERS },
    });
  }

  // Check negative cache — instant 404
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
