import { NextRequest } from "next/server";
import { handleApiRequest, errorResponse } from "@/lib/api-utils";
import { getAlbumInfo } from "@/lib/appleMusic/albumInfo";
import type { AlbumInfo } from "@/types/music";

export async function GET(request: NextRequest) {
  const idParam = request.nextUrl.searchParams.get("id");

  if (!idParam) {
    return errorResponse("Missing id", 400);
  }

  return handleApiRequest(
    async (): Promise<AlbumInfo> => {
      const album = await getAlbumInfo(idParam);
      if (!album) throw new Error("Album not found");
      return album;
    },
    "Failed to fetch album info",
    "album",
  );
}
