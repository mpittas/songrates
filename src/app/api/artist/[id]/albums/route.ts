import { NextRequest, NextResponse } from "next/server";
import { getArtistAlbums } from "@/lib/musicbrainz";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  try {
    const albums = await getArtistAlbums(id);
    return NextResponse.json(albums, {
      headers: {
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch albums" },
      { status: 500 },
    );
  }
}
