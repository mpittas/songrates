import { NextRequest, NextResponse } from "next/server";

const MB_USER_AGENT = "SongRates/1.0 (mpittas@gmail.com)";
const MB_BASE_URL = "https://musicbrainz.org/ws/2";

export async function GET(request: NextRequest) {
  const artistId = request.nextUrl.searchParams.get("artistId");
  if (!artistId) return NextResponse.json({ albums: [] });

  // Fetch Release Groups (Albums)
  // primary-type=Album filters for main albums
  const url = `${MB_BASE_URL}/release-group?artist=${artistId}&type=album&fmt=json&limit=100`;

  try {
    const res = await fetch(url, {
      headers: { "User-Agent": MB_USER_AGENT, Accept: "application/json" },
      next: { revalidate: 3600 },
    });

    if (!res.ok) throw new Error("MB API Error");
    const data = await res.json();

    // Filter strictly for official albums (exclude compilations, live, etc.)
    const albums = data["release-groups"]
      .filter(
        (rg: any) =>
          rg["primary-type"] === "Album" &&
          (!rg["secondary-types"] || rg["secondary-types"].length === 0),
      )
      .map((rg: any) => ({
        id: rg.id,
        title: rg.title,
        releaseDate: rg["first-release-date"],
      }))
      .sort((a: any, b: any) =>
        (b.releaseDate || "").localeCompare(a.releaseDate || ""),
      );

    return NextResponse.json({ albums });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ albums: [] });
  }
}
