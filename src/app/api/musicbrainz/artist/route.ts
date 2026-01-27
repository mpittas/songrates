import { NextRequest, NextResponse } from "next/server";
import Fuse from "fuse.js";

const MB_USER_AGENT = "SongRates/1.0 (mpittas@gmail.com)";
const MB_BASE_URL = "https://musicbrainz.org/ws/2";

interface Artist {
  id: string;
  name: string;
  disambiguation?: string;
  country?: string;
  type?: string;
  score?: number;
}

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

  // Search
  if (!query || query.trim().length < 2) {
    return NextResponse.json({ artists: [] });
  }

  const data = await fetchMB("artist", { query: query.trim(), limit: "25" });
  if (!data?.artists?.length) {
    return NextResponse.json({ artists: [] });
  }

  // Map results
  const artists: Artist[] = data.artists.map((a: any) => ({
    id: a.id,
    name: a.name,
    disambiguation: a.disambiguation,
    country: a.country,
    type: a.type,
    score: a.score,
  }));

  // Re-rank with Fuse.js for better relevance
  const fuse = new Fuse(artists, {
    keys: ["name"],
    threshold: 0.4,
    includeScore: true,
  });

  const results = fuse.search(query.trim());
  const ranked = results.length > 0 ? results.map((r) => r.item) : artists;

  return NextResponse.json({ artists: ranked.slice(0, 10) });
}
