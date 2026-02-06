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
  releaseDate?: string;
  wikipediaUrl?: string;
  wikidataId?: string;
  rating?: number | null;
}

export interface TrackInfo extends Track {
  number: string;
  length?: number;
  artists?: { id: string; name: string; joinPhrase?: string }[];
  /** MusicBrainz recording MBID — used for ListenBrainz lookups */
  recordingId?: string;
}

export interface AlbumInfo {
  id: string;
  title: string;
  artist: { name: string; id: string };
  type: string;
  releaseDate: string;
  genres: string[];
  rating: number | null;
  wikipediaUrl: string | null;
  links?: {
    discogs?: string;
    allmusic?: string;
    bandcamp?: string;
    spotify?: string;
    description?: string;
  };
  tracks: TrackInfo[];
}

export interface ArtistInfo {
  image: string | null;
  description: string | null;
  wikipedia: string | null;
  twitter: string | null;
  instagram: string | null;
  facebook: string | null;
  youtube: string | null;
  spotify: string | null;
  officialSite: string | null;
  genres: string[];
  beginDate: string | null;
  endDate: string | null;
  country: string | null;
}

export interface ArtistData {
  id: string;
  name: string | null;
  country: string | null;
  lifeSpan: any;
}

export interface Release {
  id: string;
  title: string;
  releaseDate?: string;
  wikipediaUrl?: string;
}

export interface GroupedReleases {
  [type: string]: Release[];
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
