export interface Track {
  id: string;
  title: string;
  artistName?: string;
  artistId?: string;
  albumId?: string;
  albumImageUrl?: string;
  albumTitle?: string;
  releaseDate?: string;
  totalTracks?: number;
  length?: number;
  number?: string;
  artists?: { id: string; name: string }[];
}

export interface Album {
  id: string;
  title: string;
  artistName?: string;
  artworkUrl?: string;
  releaseDate?: string;
  rating?: number | null;
  /** "Album" | "EP" | "Single" | "Compilation" */
  type?: string;
}

export interface TrackInfo extends Track {
  number: string;
  length?: number;
  artists?: { id: string; name: string; joinPhrase?: string }[];
}

export interface AlbumInfo {
  id: string;
  title: string;
  artist: { name: string; id: string };
  /** "Album" | "EP" | "Single" | "Compilation" */
  type: string;
  releaseDate: string;
  genres: string[];
  artworkUrl?: string;
  url?: string;
  copyright?: string;
  editorialNotes?: string;
  tracks: TrackInfo[];
}

export interface ArtistInfo {
  image: string | null;
  description: string | null;
  url: string | null;
  genres: string[];
}

export interface ArtistData {
  id: string;
  name: string | null;
}

export interface Release {
  id: string;
  title: string;
  artworkUrl?: string;
  releaseDate?: string;
  /** "Album" | "EP" | "Single" | "Compilation" */
  type?: string;
}

export interface GroupedReleases {
  [type: string]: Release[];
}

export interface TopSong {
  id: string;
  name: string;
  artistName: string;
  artistId?: string;
  albumName?: string;
  albumId?: string;
  artworkUrl?: string;
  releaseDate?: string;
  durationMs?: number;
}

export interface AlbumContext {
  albumId: string;
  title: string;
  artistName: string;
  releaseDate?: string;
  totalTracks: number;
}

export interface RatedAlbumData {
  id: string;
  title: string;
  artistName: string;
  releaseDate?: string;
  totalTracks: number;
  ratedTrackIds: string[];
  ratedAt?: string;
}

export interface PublicAlbumRating {
  albumId: string;
  averageRating: number;
  ratingCount: number;
}
