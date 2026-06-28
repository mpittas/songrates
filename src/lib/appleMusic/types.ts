/**
 * Type definitions for the Apple Music API client.
 *
 * Dependency root: nothing in this file imports from the other appleMusic
 * modules, so any of them can import from here without creating a cycle.
 */

// ─── Search result shapes ────────────────────────────────────────────────────

export interface AppleArtistResult {
  id: string;
  name: string;
  genres: string[];
  artworkUrl?: string;
  url?: string;
}

export interface AppleAlbumResult {
  id: string;
  name: string;
  artistName: string;
  artistId?: string;
  artworkUrl?: string;
  releaseDate?: string;
  trackCount?: number;
  contentRating?: string;
  isSingle?: boolean;
  isCompilation?: boolean;
  isComplete?: boolean;
  genreNames?: string[];
  url?: string;
}

export interface AppleSongResult {
  id: string;
  name: string;
  artistName: string;
  artistId?: string;
  artists?: { id: string; name: string }[];
  albumName?: string;
  albumId?: string;
  artworkUrl?: string;
  releaseDate?: string;
  durationMs?: number;
  trackNumber?: number;
  discNumber?: number;
  genreNames?: string[];
  url?: string;
  hasLyrics?: boolean;
}

export interface AppleSearchResult {
  artists: AppleArtistResult[];
  albums: AppleAlbumResult[];
  songs: AppleSongResult[];
}

// ─── Enrichment shapes ───────────────────────────────────────────────────────

export type AppleSongEnrichment = {
  name?: string;
  artists: { id: string; name: string }[];
  albumId?: string;
  albumName?: string;
  durationMs?: number;
};

export type AppleAlbumEnrichment = {
  name: string;
  artistName: string;
  artistId?: string;
  artworkUrl?: string;
  releaseDate?: string;
};

export type AppleArtistEnrichment = {
  name: string;
  artworkUrl?: string;
  genres?: string[];
};

// ─── Artist / discography ────────────────────────────────────────────────────

export interface AppleArtistDetail {
  id: string;
  name: string;
  genres: string[];
  artworkUrl?: string;
  url?: string;
}

export interface AppleArtistAlbum {
  id: string;
  name: string;
  artistName: string;
  artworkUrl?: string;
  releaseDate?: string;
  trackCount?: number;
  isSingle: boolean;
  isCompilation: boolean;
  genreNames?: string[];
  contentRating?: string;
  url?: string;
}

export interface AppleTopSong {
  id: string;
  name: string;
  artistName: string;
  artistId?: string;
  artists?: { id: string; name: string }[];
  albumName?: string;
  albumId?: string;
  artworkUrl?: string;
  releaseDate?: string;
  durationMs?: number;
  trackNumber?: number;
  url?: string;
}

export interface ArtistDiscography {
  artist: AppleArtistDetail;
  topSongs: AppleTopSong[];
  featuredAlbums: AppleArtistAlbum[];
  fullAlbums: AppleArtistAlbum[];
  singles: AppleArtistAlbum[];
  compilations: AppleArtistAlbum[];
  appearsOn: AppleArtistAlbum[];
}

// ─── Album detail ────────────────────────────────────────────────────────────

export interface AppleTrack {
  id: string;
  name: string;
  artistName: string;
  artistId?: string;
  trackNumber: number;
  discNumber: number;
  durationMs: number;
  artworkUrl?: string;
  url?: string;
  hasLyrics?: boolean;
  genreNames?: string[];
  artists?: { id: string; name: string }[];
}

export interface AppleAlbumDetail {
  id: string;
  name: string;
  artistName: string;
  /**
   * Primary album artist resolved from relationships.artists[0].
   * Apple's attributes.artistName can be a display string like "A & B".
   */
  primaryArtistName?: string;
  artistId?: string;
  artworkUrl?: string;
  releaseDate?: string;
  trackCount: number;
  genreNames: string[];
  isSingle: boolean;
  isCompilation: boolean;
  isComplete: boolean;
  contentRating?: string;
  copyright?: string;
  editorialNotes?: string;
  url?: string;
  tracks: AppleTrack[];
  otherVersions?: {
    id: string;
    name: string;
    artworkUrl?: string;
    releaseDate?: string;
    isSingle?: boolean;
    isCompilation?: boolean;
    trackCount?: number;
  }[];
}

// ─── Playlists ───────────────────────────────────────────────────────────────

export interface ApplePlaylistResult {
  id: string;
  name: string;
  curatorName: string;
  artworkUrl?: string;
  description?: string;
  url?: string;
}

export interface ApplePlaylistDetail extends ApplePlaylistResult {
  tracks: AppleSongResult[];
  trackCount: number;
}

// ─── Explore / charts / browse ───────────────────────────────────────────────

export interface AppleGenreResult {
  id: string;
  name: string;
}

export interface AppleExploreGenreSection {
  genre: AppleGenreResult;
  songs: AppleSongResult[];
  albums: AppleAlbumResult[];
}

export interface AppleExploreData {
  topSongs: AppleSongResult[];
  topAlbums: AppleAlbumResult[];
  chartPlaylists: ApplePlaylistResult[];
  editorialPlaylists: ApplePlaylistResult[];
  genreSections: AppleExploreGenreSection[];
}

export interface BrowsePillConfig {
  key: string;
  label: string;
  query: string;
}

export interface BrowsePill extends BrowsePillConfig {
  playlists: ApplePlaylistResult[];
}

export interface BrowseSection {
  key: "moods" | "categories";
  label: string;
  pills: BrowsePill[];
}

export interface AppleBrowseData {
  moods: BrowseSection;
  categories: BrowseSection;
}

// ─── Internal raw response shapes (not part of the public surface) ───────────

export type AppleChartGroup<T> = { data?: T[] } | Array<{ data?: T[] }>;

export type AppleChartsResponse = {
  results?: {
    songs?: AppleChartGroup<unknown>;
    albums?: AppleChartGroup<unknown>;
    playlists?: AppleChartGroup<unknown>;
  };
};

export type AppleGenreResource = {
  id: string;
  attributes?: {
    name?: string;
  };
};

export type AppleGenresResponse = {
  data?: AppleGenreResource[];
};

export type ApplePlaylistSearchResponse = {
  results?: {
    playlists?: {
      data?: unknown[];
    };
  };
};
