import { NextRequest } from "next/server";
import { getArtistPopularity } from "@/lib/lastfm";
import { handleApiRequest, errorResponse } from "@/lib/api-utils";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const artistName = searchParams.get("artistName");

  if (!artistName) {
    return errorResponse("Missing artistName parameter", 400);
  }

  return handleApiRequest(
    () => getArtistPopularity(artistName),
    "Failed to fetch popularity data",
    "search",
  );
}
