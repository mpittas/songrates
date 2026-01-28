import { NextRequest, NextResponse } from "next/server";

const MB_USER_AGENT = "SongRates/1.0 (mpittas@gmail.com)";
const MB_BASE_URL = "https://musicbrainz.org/ws/2";

async function fetchMB(endpoint: string, params: Record<string, string>) {
  const searchParams = new URLSearchParams({ ...params, fmt: "json" });
  const res = await fetch(`${MB_BASE_URL}/${endpoint}?${searchParams}`, {
    headers: { "User-Agent": MB_USER_AGENT, Accept: "application/json" },
    next: { revalidate: 3600 },
  });
  if (!res.ok) return null;
  return res.json();
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const query = searchParams.get("query");
  const id = searchParams.get("id");

  // Single artist lookup
  if (id) {
    const data = await fetchMB(`artist/${id}`, {});
    if (!data) return NextResponse.json({ artist: null });
    return NextResponse.json({
      artist: {
        id: data.id,
        name: data.name,
        country: data.country,
        lifeSpan: data["life-span"],
      },
    });
  }

  // Search - returns results sorted by MusicBrainz popularity
  if (!query || query.trim().length < 2) {
    return NextResponse.json({ artists: [] });
  }

  const data = await fetchMB("artist", { query: query.trim(), limit: "10" });

  return NextResponse.json({ artists: data?.artists || [] });
}
