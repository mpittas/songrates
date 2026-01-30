import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const artist = request.nextUrl.searchParams.get("artist");
  const title = request.nextUrl.searchParams.get("title");

  if (!artist || !title) {
    return NextResponse.json({
      lyrics: null,
      error: "Missing artist or title",
    });
  }

  try {
    // Clean up artist and title for better matching
    const cleanArtist = artist.replace(/\s+/g, " ").trim();
    const cleanTitle = title
      .replace(/\s*\(.*?\)\s*/g, "") // Remove parenthetical info like "(feat. X)"
      .replace(/\s*\[.*?\]\s*/g, "") // Remove bracketed info
      .replace(/\s+/g, " ")
      .trim();

    const res = await fetch(
      `https://api.lyrics.ovh/v1/${encodeURIComponent(cleanArtist)}/${encodeURIComponent(cleanTitle)}`,
      {
        next: { revalidate: 86400 }, // Cache for 24 hours
      },
    );

    if (!res.ok) {
      return NextResponse.json({ lyrics: null, available: false });
    }

    const data = await res.json();

    if (data.lyrics) {
      return NextResponse.json({
        lyrics: data.lyrics,
        available: true,
      });
    }

    return NextResponse.json({ lyrics: null, available: false });
  } catch (e) {
    console.error("Lyrics API error:", e);
    return NextResponse.json({ lyrics: null, available: false });
  }
}
