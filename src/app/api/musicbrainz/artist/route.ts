import { NextRequest, NextResponse } from "next/server";

const MB_USER_AGENT = "SongRates/1.0 (mpittas@gmail.com)"; // Good practice to include contact info
const MB_BASE_URL = "https://musicbrainz.org/ws/2";

// Helper for MusicBrainz requests
async function fetchMB(endpoint: string, params: Record<string, string>) {
  const searchParams = new URLSearchParams({ ...params, fmt: "json" });
  const url = `${MB_BASE_URL}/${endpoint}?${searchParams.toString()}`;

  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": MB_USER_AGENT,
        Accept: "application/json",
      },
      next: { revalidate: 3600 }, // Cache for 1 hour
    });

    if (!res.ok) throw new Error(`MB API Error: ${res.status}`);
    return await res.json();
  } catch (e) {
    console.error(e);
    return null;
  }
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get("query");
  const id = searchParams.get("id");

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

  if (!query) return NextResponse.json({ artists: [] });

  const data = await fetchMB("artist", {
    query: `artist:${query}`,
    limit: "25", // Request more to filter
  });

  if (!data?.artists) return NextResponse.json({ artists: [] });

  // Filter and sort artists to prioritize official/verified ones
  const filteredArtists = data.artists
    // Keep only artists with score >= 85 (MusicBrainz relevance score)
    // This filters out most fake/duplicate artists
    .filter((a: any) => a.score >= 85)
    // Sort by score descending (most relevant first)
    .sort((a: any, b: any) => b.score - a.score)
    // Take top 10
    .slice(0, 10)
    .map((a: any) => ({
      id: a.id,
      name: a.name,
      disambiguation: a.disambiguation,
      country: a.country,
      type: a.type, // "Person" or "Group"
      lifeSpan: a["life-span"],
      score: a.score, // Include score for debugging/display
    }));

  return NextResponse.json({
    artists: filteredArtists,
  });
}
