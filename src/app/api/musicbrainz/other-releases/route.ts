/**
 * @deprecated Use /api/artist/[id]/releases instead
 */
import { NextRequest } from "next/server";
import { getOtherReleases } from "@/lib/musicbrainz";
import { handleApiRequest, successResponse } from "@/lib/api-utils";

export async function GET(request: NextRequest) {
  const artistId = request.nextUrl.searchParams.get("artistId");

  if (!artistId) {
    return successResponse({ releases: {} }, "album");
  }

  return handleApiRequest(
    async () => ({ releases: await getOtherReleases(artistId) }),
    "Failed to fetch releases",
    "album",
  );
}
