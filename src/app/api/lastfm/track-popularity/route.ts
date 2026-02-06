import { NextRequest } from "next/server";
import { errorResponse, successResponse } from "@/lib/api-utils";

const LASTFM_BASE_URL = "http://ws.audioscrobbler.com/2.0/";

export async function POST(request: NextRequest) {
  const apiKey = process.env.LASTFM_API_KEY;
  if (!apiKey) {
    return errorResponse("Missing LASTFM_API_KEY", 500);
  }

  let body: { tracks: { title: string; artistName: string }[] };
  try {
    body = await request.json();
  } catch {
    return errorResponse("Invalid JSON body", 400);
  }

  const { tracks } = body;
  if (!Array.isArray(tracks) || tracks.length === 0) {
    return errorResponse("Missing or empty tracks array", 400);
  }

  const playcounts: Record<string, number> = {};

  // Process in batches to avoid rate limiting
  const batchSize = 5;
  const limited = tracks.slice(0, 30); // Cap at 30 tracks

  for (let i = 0; i < limited.length; i += batchSize) {
    const batch = limited.slice(i, i + batchSize);

    const promises = batch.map(async (track) => {
      try {
        const url = `${LASTFM_BASE_URL}?method=track.getInfo&artist=${encodeURIComponent(
          track.artistName,
        )}&track=${encodeURIComponent(track.title)}&api_key=${apiKey}&format=json`;

        const res = await fetch(url, { next: { revalidate: 1800 } });
        if (!res.ok) return;

        const data = await res.json();
        const playcount = parseInt(data?.track?.playcount, 10);
        if (playcount > 0) {
          playcounts[track.title] = playcount;
        }
      } catch {
        // Silently fail - playcount is optional enrichment
      }
    });

    await Promise.all(promises);

    // Small delay between batches
    if (i + batchSize < limited.length) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }

  return successResponse(playcounts, "search");
}
