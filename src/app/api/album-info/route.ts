import { NextRequest } from "next/server";
import { handleApiRequest, errorResponse } from "@/lib/api-utils";
import { getAlbumInfo, getAlbumInfoLite } from "@/lib/appleMusic/albumInfo";
import type { AlbumInfo } from "@/types/music";

export async function GET(request: NextRequest) {
  const idParam = request.nextUrl.searchParams.get("id");

  if (!idParam) {
    return errorResponse("Missing id", 400);
  }

  const lite = request.nextUrl.searchParams.get("lite") === "1";

  return handleApiRequest(
    async (): Promise<AlbumInfo> => {
      const album = lite
        ? await getAlbumInfoLite(idParam)
        : await getAlbumInfo(idParam);
      if (!album) throw new Error("Album not found");
      return album;
    },
    "Failed to fetch album info",
    "album",
  );
}
