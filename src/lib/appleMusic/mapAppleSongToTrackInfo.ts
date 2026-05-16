import type { TrackInfo } from "@/types/music";

import { artworkUrl, type AppleSongResult } from "./api";

/**
 * Map an Apple Music catalog song (e.g. from a playlist) into our TrackInfo shape
 * for SongRow / player queue.
 */
export function mapAppleSongToTrackInfo(
  song: AppleSongResult,
  fallbackArtworkUrl?: string,
): TrackInfo {
  const albumImage =
    (song.artworkUrl ? artworkUrl(song.artworkUrl, 400) : undefined) ||
    fallbackArtworkUrl;

  const artists =
    song.artists && song.artists.length > 0
      ? song.artists.filter((a) => a.id && a.name)
      : song.artistId && song.artistName
        ? [{ id: song.artistId, name: song.artistName }]
        : [];

  return {
    id: song.id,
    title: song.name,
    artistName: song.artistName,
    artistId: song.artistId,
    albumId: song.albumId,
    albumTitle: song.albumName,
    albumImageUrl: albumImage,
    releaseDate: song.releaseDate,
    length: song.durationMs,
    number: String(song.trackNumber ?? 0),
    artists,
    hasLyrics: song.hasLyrics,
  };
}
