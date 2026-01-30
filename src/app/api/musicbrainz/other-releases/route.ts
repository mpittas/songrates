import { NextRequest, NextResponse } from "next/server";
import { getOtherReleases } from "@/lib/musicbrainz";

export async function GET(request: NextRequest) {
  const artistId = request.nextUrl.searchParams.get("artistId");
  if (!artistId) return NextResponse.json({ releases: {} });

  const releases = await getOtherReleases(artistId);

  const response = NextResponse.json({ releases });

  response.headers.set(
    "Cache-Control",
    "public, max-age=3600, s-maxage=86400, stale-while-revalidate=86400",
  );

  return response;
}
