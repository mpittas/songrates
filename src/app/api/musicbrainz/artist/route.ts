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

// Helper for MusicBrainz requests
async function fetchMB(endpoint: string, params: Record<string, string>) {
  const searchParams = new URLSearchParams({ ...params, fmt: "json" });
  const url = `${MB_BASE_URL}/${endpoint}?${searchParams.toString()}`;

  const res = await fetch(url, {
    headers: {
      "User-Agent": MB_USER_AGENT,
      Accept: "application/json",
    },
    next: { revalidate: 3600 },
  });

  if (!res.ok) return null;
  return res.json();
}

// Check if artist has any releases
async function hasReleases(artistId: string): Promise<boolean> {
  const data = await fetchMB("release-group", { artist: artistId, limit: "1" });
  return data?.["release-group-count"] > 0;
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
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

  if (!query || query.trim().length < 2) {
    return NextResponse.json({ artists: [] });
  }

  const trimmedQuery = query.trim();

  // Search with fuzzy matching
  const data = await fetchMB("artist", {
    query: `${trimmedQuery}~`,
    limit: "50",
  });

  if (!data?.artists?.length) {
    return NextResponse.json({ artists: [] });
  }

  // Map and sort by popularity
  const candidates: Artist[] = data.artists
    .sort((a: any, b: any) => (b.score || 0) - (a.score || 0))
    .map((a: any) => ({
      id: a.id,
      name: a.name,
      disambiguation: a.disambiguation,
      country: a.country,
      type: a.type,
      score: a.score,
    }));

  // Re-rank with Fuse.js
  const fuse = new Fuse(candidates, {
    keys: [
      { name: "name", weight: 0.9 },
      { name: "disambiguation", weight: 0.1 },
    ],
    threshold: 0.5,
    includeScore: true,
    ignoreLocation: true,
  });

  const fuseResults = fuse.search(trimmedQuery);

  let rankedArtists: Artist[];
  if (fuseResults.length > 0) {
    rankedArtists = fuseResults
      .map((r) => ({
        artist: r.item,
        combinedScore:
          (1 - (r.score || 0)) * 0.4 + ((r.item.score || 0) / 100) * 0.6,
      }))
      .sort((a, b) => b.combinedScore - a.combinedScore)
      .map((r) => r.artist);
  } else {
    rankedArtists = candidates;
  }

  // Verify top 15 in parallel for speed, return first 10 with releases
  const top15 = rankedArtists.slice(0, 15);
  const checks = await Promise.all(top15.map((a) => hasReleases(a.id)));
  const verified = top15.filter((_, i) => checks[i]).slice(0, 10);

  return NextResponse.json({ artists: verified });
}
