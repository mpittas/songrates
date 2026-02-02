import { NextRequest, NextResponse } from "next/server";
import { getArtistPopularity } from "@/lib/lastfm";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const artistName = searchParams.get("artistName");

  if (!artistName) {
    return NextResponse.json(
      { error: "Missing artistName parameter" },
      { status: 400 },
    );
  }

  try {
    const scores = await getArtistPopularity(artistName);
    return NextResponse.json(scores);
  } catch (error) {
    console.error("Last.fm proxy error:", error);
    return NextResponse.json(
      { error: "Failed to fetch popularity data" },
      { status: 500 },
    );
  }
}
