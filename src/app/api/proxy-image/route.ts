import { NextRequest, NextResponse } from "next/server";

const IMAGE_CACHE = new Map<
  string,
  { buffer: ArrayBuffer; contentType: string; timestamp: number }
>();
const CACHE_TTL = 86400 * 1000; // 24 hours
const CACHE_HEADERS = {
  "Cache-Control":
    "public, max-age=86400, s-maxage=604800, stale-while-revalidate=2592000",
};

async function fetchFromiTunes(
  releaseGroupId: string,
): Promise<ArrayBuffer | null> {
  try {
    // Step 1: Get album metadata from MusicBrainz
    const mbRes = await fetch(
      `https://musicbrainz.org/ws/2/release-group/${releaseGroupId}?fmt=json&inc=artists`,
      {
        headers: { "User-Agent": "SongRates/1.0 (cover art proxy)" },
        signal: AbortSignal.timeout(5000),
      },
    );

    if (!mbRes.ok) {
      console.log(
        `[iTunes] MusicBrainz failed for ${releaseGroupId}: ${mbRes.status}`,
      );
      return null;
    }

    const mbData = await mbRes.json();
    const title = mbData.title;
    const artist = mbData["artist-credit"]?.[0]?.name;

    if (!title || !artist) {
      console.log(`[iTunes] Missing metadata for ${releaseGroupId}`);
      return null;
    }

    // Step 2: Search iTunes for album artwork
    const query = encodeURIComponent(`${title} ${artist}`);
    const itunesRes = await fetch(
      `https://itunes.apple.com/search?term=${query}&entity=album&limit=1`,
      { signal: AbortSignal.timeout(5000) },
    );

    if (!itunesRes.ok) return null;

    const itunesData = await itunesRes.json();
    const artworkUrl = itunesData.results?.[0]?.artworkUrl100;

    if (!artworkUrl) {
      console.log(`[iTunes] No artwork found for "${title}" by ${artist}`);
      return null;
    }

    // Get higher resolution (600x600 instead of 100x100)
    const highResUrl = artworkUrl.replace("100x100bb", "600x600bb");

    // Step 3: Fetch the actual image
    const imageRes = await fetch(highResUrl, {
      signal: AbortSignal.timeout(10000),
    });

    if (!imageRes.ok) return null;

    return await imageRes.arrayBuffer();
  } catch (err) {
    console.log(
      `[iTunes] Error for ${releaseGroupId}:`,
      err instanceof Error ? err.message : "unknown",
    );
    return null;
  }
}

async function fetchFromCoverArtArchive(
  releaseGroupId: string,
): Promise<ArrayBuffer | null> {
  try {
    // Get redirect URL from coverartarchive.org
    const redirectRes = await fetch(
      `https://coverartarchive.org/release-group/${releaseGroupId}/front-250`,
      {
        redirect: "manual",
        signal: AbortSignal.timeout(3000),
      },
    );

    if (redirectRes.status === 404) {
      console.log(`[CAA] No cover art for ${releaseGroupId}`);
      return null;
    }

    const imageUrl = redirectRes.headers.get("location");
    if (!imageUrl) return null;

    // Fetch from archive.org with shorter timeout (often unreliable)
    const imageRes = await fetch(imageUrl, {
      signal: AbortSignal.timeout(8000),
      headers: { "User-Agent": "SongRates/1.0 (cover art proxy)" },
    });

    if (!imageRes.ok) return null;

    return await imageRes.arrayBuffer();
  } catch (err) {
    console.log(
      `[CAA] Error for ${releaseGroupId}:`,
      err instanceof Error ? err.message : "unknown",
    );
    return null;
  }
}

export async function GET(request: NextRequest) {
  const id = request.nextUrl.searchParams.get("id");

  if (!id) {
    return new NextResponse(null, { status: 400 });
  }

  // Check in-memory cache
  const cached = IMAGE_CACHE.get(id);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return new NextResponse(cached.buffer, {
      status: 200,
      headers: { "Content-Type": cached.contentType, ...CACHE_HEADERS },
    });
  }

  // Try iTunes first (fast, reliable), then Cover Art Archive as fallback
  let buffer = await fetchFromiTunes(id);
  if (!buffer) {
    buffer = await fetchFromCoverArtArchive(id);
  }

  if (!buffer) {
    return new NextResponse(null, { status: 404 });
  }

  const contentType = "image/jpeg";

  // Store in memory cache
  IMAGE_CACHE.set(id, { buffer, contentType, timestamp: Date.now() });

  // Evict old entries if cache grows too large (>200 items)
  if (IMAGE_CACHE.size > 200) {
    const oldest = [...IMAGE_CACHE.entries()]
      .sort((a, b) => a[1].timestamp - b[1].timestamp)
      .slice(0, 50);
    for (const [key] of oldest) IMAGE_CACHE.delete(key);
  }

  return new NextResponse(buffer, {
    status: 200,
    headers: { "Content-Type": contentType, ...CACHE_HEADERS },
  });
}
