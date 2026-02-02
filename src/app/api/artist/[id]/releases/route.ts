import { NextRequest } from "next/server";
import { getOtherReleases } from "@/lib/musicbrainz";
import { handleApiRequest, getRouteId } from "@/lib/api-utils";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const id = await getRouteId(params);

  if (!id) {
    return new Response("Missing artist ID", { status: 400 });
  }

  return handleApiRequest(
    () => getOtherReleases(id),
    "Failed to fetch releases",
    "album",
  );
}
