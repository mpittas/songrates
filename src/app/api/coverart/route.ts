import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const id = request.nextUrl.searchParams.get("id"); // Can be MBID of Release Group
  if (!id) return NextResponse.json({ url: null });

  try {
    const res = await fetch(`https://coverartarchive.org/release-group/${id}`, {
      next: { revalidate: 86400 }, // Cache for 24h
    });

    if (!res.ok) return NextResponse.json({ url: null });

    const data = await res.json();
    const image =
      data.images?.find((img: any) => img.front) || data.images?.[0];

    const response = NextResponse.json({
      // Prefer smallest thumbnail: 250px > small > full image
      url:
        image?.thumbnails?.["250"] ||
        image?.thumbnails?.small ||
        image?.image ||
        null,
    });

    // Cache for 1 week in browser, 1 day on CDN
    response.headers.set(
      "Cache-Control",
      "public, max-age=604800, s-maxage=86400, stale-while-revalidate=86400",
    );
    return response;
  } catch {
    return NextResponse.json({ url: null });
  }
}
