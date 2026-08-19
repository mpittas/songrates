import type { AppleTopSong } from "./types";

const ALTERNATE_VERSION =
  /\b(remix|acoustic|instrumental|karaoke|piano version|track by track|commentary|\(mixed\)|\[mixed\])\b/i;

export function isAlternateLatestSongName(name: string): boolean {
  return ALTERNATE_VERSION.test(name);
}

/** Collapse remasters / parenthetical versions so "Song (feat. X)" still stays distinct. */
export function songTitleKey(name: string): string {
  return name
    .toLowerCase()
    .replace(/\s*[\(\[][^)\]]*[\)\]]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * True when a catalog credit line names this artist (primary or featured).
 * Word-boundary style so "Nas" does not match "Nasty".
 */
export function artistNameMentions(
  creditLine: string,
  artistName: string,
): boolean {
  const name = artistName.trim();
  if (!name || !creditLine.trim()) return false;
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`(?:^|\\W)${escaped}(?:$|\\W)`, "i").test(creditLine);
}

type AppleTrackArtistRef = { id?: string };

type AppleAlbumTrack = {
  id?: string;
  type?: string;
  attributes?: {
    name?: string;
    artistName?: string;
    albumName?: string;
    artwork?: { url?: string };
    releaseDate?: string;
    durationInMillis?: number;
    trackNumber?: number;
    url?: string;
  };
  relationships?: {
    artists?: { data?: AppleTrackArtistRef[] };
    "featured-artists"?: { data?: AppleTrackArtistRef[] };
  };
};

type AppleAlbumWithTracks = {
  id?: string;
  attributes?: {
    name?: string;
    artistName?: string;
    artwork?: { url?: string };
    releaseDate?: string;
  };
  relationships?: {
    tracks?: { data?: AppleAlbumTrack[] };
  };
};

export function trackCreditsArtist(
  track: AppleAlbumTrack,
  artist: { id: string; name: string },
): boolean {
  const creditedIds = [
    ...(track.relationships?.artists?.data || []),
    ...(track.relationships?.["featured-artists"]?.data || []),
  ]
    .map((ref) => ref.id)
    .filter((id): id is string => Boolean(id));

  if (creditedIds.includes(artist.id)) return true;
  return artistNameMentions(track.attributes?.artistName || "", artist.name);
}

export function latestSongCreditsArtist(
  song: Pick<AppleTopSong, "artistName" | "artists">,
  artist: { id: string; name: string },
): boolean {
  if (song.artists?.some((credited) => credited.id === artist.id)) return true;
  return artistNameMentions(song.artistName, artist.name);
}

/**
 * Flatten Apple album resources (latest-release / singles views with
 * `include[albums]=tracks`) into a recency-sorted song list.
 *
 * Skips music videos, remix/acoustic/instrumental variants, duplicate
 * titles, and tracks that do not credit this artist (sibling songs on a
 * featured single).
 */
export function collectLatestSongsFromAlbums(
  albums: AppleAlbumWithTracks[],
  artist: { id: string; name: string },
  limit = 20,
): AppleTopSong[] {
  const seenIds = new Set<string>();
  const seenTitles = new Set<string>();
  const songs: AppleTopSong[] = [];

  for (const album of albums) {
    if (!album?.id) continue;
    const albumAttrs = album.attributes || {};
    const tracks = album.relationships?.tracks?.data || [];

    for (const track of tracks) {
      if (track?.type !== "songs" || !track.id) continue;
      if (seenIds.has(track.id)) continue;
      if (!trackCreditsArtist(track, artist)) continue;

      const name = track.attributes?.name || "";
      if (!name || isAlternateLatestSongName(name)) continue;

      const titleKey = songTitleKey(name);
      if (titleKey && seenTitles.has(titleKey)) continue;

      seenIds.add(track.id);
      if (titleKey) seenTitles.add(titleKey);

      const sa = track.attributes || {};
      songs.push({
        id: track.id,
        name,
        artistName: sa.artistName || albumAttrs.artistName || "",
        artistId: artist.id,
        albumName: sa.albumName || albumAttrs.name,
        albumId: album.id,
        artworkUrl: sa.artwork?.url || albumAttrs.artwork?.url,
        releaseDate: sa.releaseDate || albumAttrs.releaseDate,
        durationMs: sa.durationInMillis,
        trackNumber: sa.trackNumber,
        url: sa.url,
      });
    }
  }

  return songs
    .sort((a, b) => (b.releaseDate || "").localeCompare(a.releaseDate || ""))
    .slice(0, limit);
}
