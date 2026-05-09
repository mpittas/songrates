import type { TopSong, Track } from "@/types/music";

/** Build a player queue from chart / top songs. */
export function topSongsToTrackQueue(topSongs: TopSong[]): Track[] {
  return topSongs.map((s) => ({
    id: s.id,
    title: s.name,
    artistName: s.artistName,
    artistId: s.artistId,
    albumId: s.albumId,
    albumImageUrl: s.artworkUrl,
    albumTitle: s.albumName,
    releaseDate: s.releaseDate,
    length: s.durationMs,
    artists:
      s.artistId && s.artistName
        ? [{ id: s.artistId, name: s.artistName }]
        : undefined,
  }));
}
