import { NextRequest, NextResponse } from "next/server";
import { getArtistData } from "@/lib/musicbrainz";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  try {
    const data = await getArtistData(id);
    return NextResponse.json(data, {
      headers: {
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch artist" },
      { status: 500 },
    );
  }
}
