import type { AlbumInfo, TrackInfo } from "@/types/music";

export function getAlbumPlayLabel(type: string | undefined): string {
  const t = (type || "").toLowerCase();
  if (t.includes("single")) return "Play single";
  if (t.includes("ep")) return "Play EP";
  if (t.includes("compilation")) return "Play compilation";
  return "Play album";
}

/** Written reviews are only offered on full albums and EPs. */
export function isReviewableAlbumType(type: string | undefined): boolean {
  return type === "Album" || type === "EP";
}

/** True when every track on the release has a rating. Unknown totals are not full. */
export function isFullyRatedAlbum(
  ratedCount: number,
  totalTracks: number | null | undefined,
): boolean {
  const total = Number(totalTracks) || 0;
  return total > 0 && ratedCount >= total;
}

/** Any ratings, but not a complete album (including unknown track counts). */
export function isPartiallyRatedAlbum(
  ratedCount: number,
  totalTracks: number | null | undefined,
): boolean {
  return ratedCount > 0 && !isFullyRatedAlbum(ratedCount, totalTracks);
}

export function computeTrackRatingStats(
  tracks: TrackInfo[],
  activeRatings: Record<string, number>,
) {
  const totalTracks = tracks.length;
  const ratedTracksCount = tracks.filter((tr) => activeRatings[tr.id] > 0).length;
  const isFullyRated = isFullyRatedAlbum(ratedTracksCount, totalTracks);
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
