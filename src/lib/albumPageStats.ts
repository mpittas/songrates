import type { AlbumInfo, TrackInfo } from "@/types/music";

export function getAlbumPlayLabel(type: string | undefined): string {
  const t = (type || "").toLowerCase();
  if (t.includes("single")) return "Play single";
  if (t.includes("ep")) return "Play EP";
  if (t.includes("compilation")) return "Play compilation";
  return "Play album";
}

export function computeTrackRatingStats(
  tracks: TrackInfo[],
  activeRatings: Record<string, number>,
) {
  const totalTracks = tracks.length;
  const ratedTracksCount = tracks.filter((tr) => activeRatings[tr.id] > 0).length;
  const isFullyRated = totalTracks > 0 && ratedTracksCount === totalTracks;
  const currentTotalScore = tracks.reduce(
    (acc, tr) => acc + (activeRatings[tr.id] || 0),
    0,
  );
  const averageScore =
    ratedTracksCount > 0
      ? (currentTotalScore / ratedTracksCount).toFixed(1)
      : 0;

  return {
    totalTracks,
    ratedTracksCount,
    isFullyRated,
    averageScore,
  };
}

/** Artists shown under the album title (feat. list from first track, else primary). */
export function getAlbumSubtitleArtists(
  album: AlbumInfo,
): { id: string; name: string }[] {
  const first = album.tracks?.[0];
  if (first?.artists && first.artists.length > 0) {
    return first.artists.map((a) => ({ id: a.id, name: a.name }));
  }
  if (album.artist?.name) {
    return [{ id: album.artist.id, name: album.artist.name }];
  }
  return [];
}
