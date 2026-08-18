import { NextRequest, NextResponse } from "next/server";
import { fetchAppleAlbumEnrichmentsByIds } from "@/lib/appleMusic/api";
import { errorResponse } from "@/lib/api-utils";

const MAX_IDS = 240;

/**
 * Batch-lookup Apple Music track counts for album catalog IDs.
 * Used to correct user_albums.total_tracks that were saved as placeholders
 * (e.g. 1) when rating from song lists / playlists.
 */
export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return errorResponse("Invalid JSON", 400);
  }

  const rawIds = (body as { ids?: unknown }).ids;
  const ids = Array.isArray(rawIds)
    ? rawIds.filter((id): id is string => typeof id === "string" && id.length > 0)
    : [];

  const unique = [...new Set(ids)].slice(0, MAX_IDS);
  if (unique.length === 0) {
    return NextResponse.json({ counts: {} });
  }

  try {
    const enrichments = await fetchAppleAlbumEnrichmentsByIds(unique);
    const counts: Record<string, number> = {};
    for (const [id, album] of enrichments) {
      if (album.trackCount && album.trackCount > 0) {
        counts[id] = album.trackCount;
      }
    }
    return NextResponse.json({ counts });
  } catch (error) {
    console.error("Failed to fetch album track counts:", error);
    return errorResponse("Failed to fetch album track counts", 500);
  }
}
