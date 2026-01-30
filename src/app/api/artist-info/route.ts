import { NextRequest, NextResponse } from "next/server";
import { getArtistData } from "@/lib/musicbrainz";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const artistId = searchParams.get("id");

  if (!artistId) {
    return NextResponse.json({ error: "Missing artist ID" }, { status: 400 });
  }

  const data = await getArtistData(artistId);

  const response = NextResponse.json(data);

  // Set cache headers (even though internal cache handles it, this helps CDN/Browser)
  response.headers.set(
    "Cache-Control",
    "public, max-age=3600, s-maxage=86400, stale-while-revalidate=86400",
  );

  return response;
}
