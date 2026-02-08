import { NextRequest } from "next/server";
import { getYTMusicArtistReleases } from "@/lib/ytmusicData";
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
    () => getYTMusicArtistReleases(id),
    "Failed to fetch releases",
    "album",
  );
}
