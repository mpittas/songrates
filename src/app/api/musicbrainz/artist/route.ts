import { NextRequest, NextResponse } from "next/server";
import { fuzzySearchArtists, Artist } from "@/lib/fuzzySearch";

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

  // Get more results from MusicBrainz with multiple matching strategies
  // - artist:query* for prefix/partial matching
  // - artist:query~ for fuzzy/typo tolerance (Levenshtein distance)
  const data = await fetchMB("artist", {
    query: `artist:${query}* OR artist:${query}~`,
    limit: "50",
  });

  if (!data?.artists) return NextResponse.json({ artists: [] });

  // First filter: keep artists with reasonable MusicBrainz score
  const candidates: Artist[] = data.artists
    .filter((a: any) => a.score >= 50) // Lower threshold to get more candidates
    .map((a: any) => ({
      id: a.id,
      name: a.name,
      disambiguation: a.disambiguation,
      country: a.country,
      type: a.type,
      lifeSpan: a["life-span"],
      score: a.score,
    }));

  // Re-rank using Fuse.js fuzzy matching
  const rankedArtists = fuzzySearchArtists(candidates, query);

  // Return top 10
  return NextResponse.json({
    artists: rankedArtists.slice(0, 10),
  });
}
