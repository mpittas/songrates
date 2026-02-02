import { NextRequest } from "next/server";
import { getArtistPopularity } from "@/lib/lastfm";
import { handleApiRequest, errorResponse } from "@/lib/api-utils";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const artistName = searchParams.get("artistName");

  if (!artistName) {
    return errorResponse("Missing artistName parameter", 400);
  }

  const response = await handleApiRequest(
    () => getArtistPopularity(artistName),
    "Failed to fetch popularity data",
    "search",
  );

  // Add Cache-Control header for 24 hours (matching the server cache)
  response.headers.set(
    "Cache-Control",
    "public, s-maxage=86400, stale-while-revalidate=3600",
  );

  return response;
}
