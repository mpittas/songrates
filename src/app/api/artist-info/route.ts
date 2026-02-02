/**
 * @deprecated Use /api/artist/[id]/data instead
 * This endpoint is kept for backward compatibility
 */
import { NextRequest } from "next/server";
import { getArtistData } from "@/lib/musicbrainz";
import { handleApiRequest, errorResponse } from "@/lib/api-utils";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const artistId = searchParams.get("id");

  if (!artistId) {
    return errorResponse("Missing artist ID", 400);
  }

  return handleApiRequest(
    () => getArtistData(artistId),
    "Failed to fetch artist info",
    "artist",
  );
}
