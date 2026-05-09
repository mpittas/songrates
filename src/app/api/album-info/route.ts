import { NextRequest } from "next/server";
import { handleApiRequest, errorResponse } from "@/lib/api-utils";
import {
  getAlbumDetail,
  classifyAlbumType,
  artworkUrl,
} from "@/lib/appleMusic/api";
import type { AlbumInfo } from "@/types/music";

/**
 * Resolve an album ID from a slug like "album-name-1440833849"
 * Apple Music IDs are numeric, so we extract the last segment
 */
function resolveAlbumId(slug: string): string {
  // If it's already a pure numeric ID, return as-is
  if (/^\d+$/.test(slug)) return slug;

  // Extract the last segment after the last hyphen (the Apple Music ID)
  const parts = slug.split("-");
  const lastPart = parts[parts.length - 1];

  // If the last part is numeric, it's the Apple Music ID
  if (/^\d+$/.test(lastPart)) return lastPart;

  // Fallback: return as-is
  return slug;
}

export async function GET(request: NextRequest) {
  const idParam = request.nextUrl.searchParams.get("id");

  if (!idParam) {
    return errorResponse("Missing id", 400);
  }

  const albumId = resolveAlbumId(idParam);

  return handleApiRequest(
    async (): Promise<AlbumInfo> => {
      const album = await getAlbumDetail(albumId);
      if (!album) throw new Error("Album not found");

      const albumType = classifyAlbumType({
        name: album.name,
        isSingle: album.isSingle,
        isCompilation: album.isCompilation,
        trackCount: album.trackCount,
      });

      return {
        id: album.id,
        title: album.name,
        artist: {
          name: album.primaryArtistName || album.artistName,
          id: album.artistId || "",
        },
        type: albumType,
        releaseDate: album.releaseDate || "",
        genres: album.genreNames,
        artworkUrl: album.artworkUrl
          ? artworkUrl(album.artworkUrl, 600)
          : undefined,
        url: album.url,
        copyright: album.copyright,
        editorialNotes: album.editorialNotes,
        tracks: album.tracks.map((t) => ({
          id: t.id,
          title: t.name.replace(/\s+\(feat\..*?\)$/i, "").trim(),
          number: String(t.trackNumber),
          length: t.durationMs,
          hasLyrics: t.hasLyrics,
          artistName: t.artistName,
          artistId: t.artistId,
          artists:
            t.artists && t.artists.length > 0
              ? t.artists
              : t.artistId
                ? [{ id: t.artistId, name: t.artistName }]
                : [],
        })),
        otherVersions: album.otherVersions?.map((v) => ({
          id: v.id,
          name: v.name,
          artworkUrl: v.artworkUrl ? artworkUrl(v.artworkUrl, 200) : undefined,
          releaseDate: v.releaseDate,
          type: classifyAlbumType({
            name: v.name,
            isSingle: v.isSingle || false,
            isCompilation: v.isCompilation || false,
            trackCount: v.trackCount,
          }),
          trackCount: v.trackCount,
        })),
      };
    },
    "Failed to fetch album info",
    "album",
  );
}
