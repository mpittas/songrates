import { NextRequest } from "next/server";
import { handleApiRequest, errorResponse } from "@/lib/api-utils";
import { getYTMusicAlbumInfo } from "@/lib/ytmusicData";

export async function GET(request: NextRequest) {
  const idParam = request.nextUrl.searchParams.get("id");

  if (!idParam) {
    return errorResponse("Missing id", 400);
  }

  return handleApiRequest(
    () => getYTMusicAlbumInfo(idParam),
    "Failed to fetch album info",
    "album",
  );
}
