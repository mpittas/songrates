/**
 * Raw Apple Music resource → typed shape parsers.
 *
 * These are module-internal helpers; none are part of the public api.ts
 * surface. They take loosely-typed Apple JSON and return the typed interfaces
 * from types.ts.
 */

import type {
  AppleArtistResult,
  AppleAlbumResult,
  AppleSongResult,
  ApplePlaylistResult,
  AppleGenreResource,
  AppleGenreResult,
  AppleArtistAlbum,
} from "./types";

export function parseArtist(item: any): AppleArtistResult {
  const a = item.attributes || {};
  return {
    id: item.id,
    name: a.name || "",
    genres: a.genreNames || [],
    artworkUrl: a.artwork?.url,
    url: a.url,
  };
}

export function parseAlbum(item: any): AppleAlbumResult {
  const a = item.attributes || {};
  const artistRel = item.relationships?.artists?.data?.[0];
  return {
    id: item.id,
    name: a.name || "",
    artistName: a.artistName || "",
    artistId: artistRel?.id,
    artworkUrl: a.artwork?.url,
    releaseDate: a.releaseDate,
    trackCount: a.trackCount,
    contentRating: a.contentRating,
    isSingle: a.isSingle === true,
    isCompilation: a.isCompilation === true,
    isComplete: a.isComplete === true,
    genreNames: a.genreNames || [],
    url: a.url,
  };
}

export function parseSong(item: any): AppleSongResult {
  const a = item.attributes || {};
  const albumRel = item.relationships?.albums?.data?.[0];
  const artistRel = item.relationships?.artists?.data?.[0];
  return {
    id: item.id,
    name: a.name || "",
    artistName: a.artistName || "",
    artistId: artistRel?.id,
    albumName: a.albumName,
    albumId: albumRel?.id || extractAlbumIdFromUrl(a.url),
    artworkUrl: a.artwork?.url,
    releaseDate: a.releaseDate,
    durationMs: a.durationInMillis,
    trackNumber: a.trackNumber,
    discNumber: a.discNumber,
    genreNames: a.genreNames || [],
    url: a.url,
  };
}

export function parsePlaylist(item: any): ApplePlaylistResult {
  const a = item.attributes || {};
  return {
    id: item.id,
    name: a.name || "",
    curatorName: a.curatorName || "",
    artworkUrl: a.artwork?.url,
    description: a.description?.standard || a.description?.short || "",
    url: a.url,
  };
}

export function parseGenre(item: AppleGenreResource): AppleGenreResult {
  const a = item.attributes || {};
  return {
    id: item.id,
    name: a.name || "",
  };
}

/**
 * Parse raw Apple Music album items into AppleArtistAlbum[]
 * (used by artist discography views).
 */
export function parseAlbumItems(items: any[]): AppleArtistAlbum[] {
  return items.map((item: any) => {
    const a = item.attributes || {};
    return {
      id: item.id,
      name: a.name || "",
      artistName: a.artistName || "",
      artworkUrl: a.artwork?.url,
      releaseDate: a.releaseDate,
      trackCount: a.trackCount,
      isSingle: a.isSingle === true,
      isCompilation: a.isCompilation === true,
      genreNames: a.genreNames || [],
      contentRating: a.contentRating,
      url: a.url,
    };
  });
}

export function extractAlbumIdFromUrl(url?: string): string | undefined {
  if (!url) return undefined;
  // Apple Music song URLs: https://music.apple.com/us/album/song-name/ALBUM_ID?i=SONG_ID
  const match = url.match(/\/album\/[^/]+\/(\d+)/);
  return match?.[1];
}

/** Primary + featured credits from a catalog `songs` resource (deduped by id). */
export function artistsFromCatalogSongResource(song: {
  relationships?: {
    artists?: { data?: Array<{ id: string; attributes?: { name?: string } }> };
    "featured-artists"?: {
      data?: Array<{ id: string; attributes?: { name?: string } }>;
    };
  };
}): { id: string; name: string }[] {
  const refs = [
    ...(song.relationships?.artists?.data || []),
    ...(song.relationships?.["featured-artists"]?.data || []),
  ];
  const unique = Array.from(new Map(refs.map((r) => [r.id, r])).values());
  return unique
    .map((ar) => ({
      id: ar.id,
      name: (ar.attributes?.name || "").trim(),
    }))
    .filter((x) => x.id && x.name);
}

/** Sort albums by release date descending */
export function sortByDateDesc(albums: AppleArtistAlbum[]): AppleArtistAlbum[] {
  return albums.sort((a, b) =>
    (b.releaseDate || "").localeCompare(a.releaseDate || ""),
  );
}

/** Flatten an Apple charts group, which may be a single chart or an array. */
export function normalizeChartData<T>(chartGroup: unknown): T[] {
  if (!chartGroup) return [];

  const charts = (Array.isArray(chartGroup) ? chartGroup : [chartGroup]) as {
    data?: T[];
  }[];
  return charts.flatMap((chart) => chart.data || []);
}
