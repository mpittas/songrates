import { NextRequest } from "next/server";
import { handleApiRequest, errorResponse } from "@/lib/api-utils";
import { getOtherReleases } from "@/lib/musicbrainz";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return errorResponse("Missing id", 400);
  }

  return handleApiRequest(
    () => getOtherReleases(id),
    "Failed to fetch other releases",
    "releases",
  );
}
