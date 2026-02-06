import { NextRequest, NextResponse } from "next/server";
import { getArtistTrackPopularity } from "@/lib/lastfm";

export const revalidate = 3600; // Cache for 1 hour

export async function POST(request: NextRequest) {
  try {
    const { artist } = await request.json();

    if (!artist) {
      return NextResponse.json(
        { error: "Artist name is required" },
        { status: 400 },
      );
    }

    const counts = await getArtistTrackPopularity(artist);

    return NextResponse.json({ counts });
  } catch (error) {
    console.error("Last.fm popularity API error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
