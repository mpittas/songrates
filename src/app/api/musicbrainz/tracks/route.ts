import { NextRequest, NextResponse } from "next/server";

const MB_USER_AGENT = "SongRates/1.0 (mpittas@gmail.com)";
const MB_BASE_URL = "https://musicbrainz.org/ws/2";

export async function GET(request: NextRequest) {
  const albumId = request.nextUrl.searchParams.get("albumId"); // This is the Release Group ID
  if (!albumId) return NextResponse.json({ tracks: [] });

  try {
    // 1. Get the 'official' Release for this Release Group (usually the earliest one)
    // We prefer releases from 'US' or 'GB' but take first available if not
    const releasesRes = await fetch(
      `${MB_BASE_URL}/release-group/${albumId}?inc=releases&fmt=json`,
      {
        headers: { "User-Agent": MB_USER_AGENT, Accept: "application/json" },
        next: { revalidate: 3600 },
      },
    );
    const releasesData = await releasesRes.json();

    // Simple heuristic: pick the oldest release to represent the "original" album
    const release = releasesData.releases?.sort((a: any, b: any) =>
      (a.date || "9999").localeCompare(b.date || "9999"),
    )[0];

    if (!release) return NextResponse.json({ tracks: [] });

    // 2. Fetch tracks for that specific Release
    // inc=recordings gives us the tracklist
    const tracksRes = await fetch(
      `${MB_BASE_URL}/release/${release.id}?inc=recordings&fmt=json`,
      {
        headers: { "User-Agent": MB_USER_AGENT, Accept: "application/json" },
        next: { revalidate: 3600 },
      },
    );
    const tracksData = await tracksRes.json();

    // Flatten media (CDs/Vinyls/Sides) into one list
    const tracks =
      tracksData.media
        ?.flatMap((m: any) => m.tracks)
        .map((t: any) => ({
          id: t.id,
          title: t.title,
          number: t.number,
          length: t.length,
        })) || [];

    return NextResponse.json({
      id: albumId,
      title: releasesData.title,
      tracks,
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ tracks: [] });
  }
}
