import {
  artworkUrl,
  classifyAlbumType,
  getAlbumDetail,
} from "@/lib/appleMusic/api";
import type { AppleTrack } from "@/lib/appleMusic/types";
import { resolveAlbumId } from "@/lib/resolveAlbumId";
import type { AlbumInfo } from "@/types/music";

export async function getAlbumInfo(idOrSlug: string): Promise<AlbumInfo | null> {
  const albumId = resolveAlbumId(idOrSlug);
  const album = await getAlbumDetail(albumId);
  if (!album) return null;

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
    artworkUrl: album.artworkUrl ? artworkUrl(album.artworkUrl, 600) : undefined,
    url: album.url,
    copyright: album.copyright,
    editorialNotes: album.editorialNotes,
    tracks: mapAlbumTracks(album.tracks),
    otherVersions: album.otherVersions?.map((version) => ({
      id: version.id,
      name: version.name,
      artworkUrl: version.artworkUrl
        ? artworkUrl(version.artworkUrl, 200)
        : undefined,
      releaseDate: version.releaseDate,
      type: classifyAlbumType({
        name: version.name,
        isSingle: version.isSingle || false,
        isCompilation: version.isCompilation || false,
        trackCount: version.trackCount,
      }),
      trackCount: version.trackCount,
    })),
  };
}

/** Tracklist-only payload for player popover — skips editorial, versions, large artwork. */
export async function getAlbumInfoLite(
  idOrSlug: string,
): Promise<AlbumInfo | null> {
  const albumId = resolveAlbumId(idOrSlug);
  const album = await getAlbumDetail(albumId);
  if (!album) return null;

  return {
    id: album.id,
    title: album.name,
    artist: {
      name: album.primaryArtistName || album.artistName,
      id: album.artistId || "",
    },
    type: classifyAlbumType({
      name: album.name,
      isSingle: album.isSingle,
      isCompilation: album.isCompilation,
      trackCount: album.trackCount,
    }),
    releaseDate: album.releaseDate || "",
    genres: [],
    artworkUrl: album.artworkUrl ? artworkUrl(album.artworkUrl, 200) : undefined,
    tracks: mapAlbumTracks(album.tracks),
  };
}

function mapAlbumTracks(tracks: AppleTrack[]) {
  return tracks.map((track) => ({
    id: track.id,
    title: track.name.replace(/\s+\(feat\..*?\)$/i, "").trim(),
    number: String(track.trackNumber),
    length: track.durationMs,
    hasLyrics: track.hasLyrics,
    artistName: track.artistName,
    artistId: track.artistId,
    artists:
      track.artists && track.artists.length > 0
        ? track.artists
        : track.artistId
          ? [{ id: track.artistId, name: track.artistName }]
          : [],
  }));
}
