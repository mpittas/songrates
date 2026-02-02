/**
 * @deprecated Use /api/artist/[id]/albums instead
 */
import { NextRequest } from "next/server";
import { getArtistAlbums } from "@/lib/musicbrainz";
import { handleApiRequest, successResponse } from "@/lib/api-utils";

export async function GET(request: NextRequest) {
  const artistId = request.nextUrl.searchParams.get("artistId");

  if (!artistId) {
    return successResponse({ albums: [] }, "album");
  }

  return handleApiRequest(
    async () => ({ albums: await getArtistAlbums(artistId) }),
    "Failed to fetch albums",
    "album",
  );
}
