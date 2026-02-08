import { Artist } from "./artist";
import { Album } from "./music";

// ─── Search Filter Types ───────────────────────────────────────────────────────

/** The user-facing search categories */
export type SearchCategory = "all" | "artist" | "album" | "song";

/** MusicBrainz entity types we actually query */
export type MBEntityType = "artist" | "release-group" | "recording";

/** Maps user-facing category → MusicBrainz entity */
export const CATEGORY_TO_MB_ENTITY: Record<
  Exclude<SearchCategory, "all">,
  MBEntityType
> = {
  artist: "artist",
  album: "release-group",
  song: "recording",
} as const;

/** Lucene field names for each entity */
export const MB_LUCENE_FIELD: Record<MBEntityType, string> = {
  artist: "artist",
  "release-group": "releasegroup",
  recording: "recording",
} as const;

// ─── Search Result Types ───────────────────────────────────────────────────────

export interface SearchResultBase {
  id: string;
  type: Exclude<SearchCategory, "all">;
  title: string;
  subtitle?: string;
  score: number;
}

export interface ArtistSearchResult extends SearchResultBase {
  type: "artist";
  country?: string;
  disambiguation?: string;
  artistType?: string; // "Group", "Person", etc.
  tags?: string[]; // Top genre/style tags from MusicBrainz
  thumbnailUrl?: string; // YTMusic thumbnail
}

export interface AlbumSearchResult extends SearchResultBase {
  type: "album";
  artistName?: string;
  artistId?: string;
  releaseDate?: string;
  primaryType?: string;
  secondaryTypes?: string[];
  thumbnailUrl?: string; // YTMusic thumbnail
}

export interface SongSearchResult extends SearchResultBase {
  type: "song";
  artistName?: string;
  artistId?: string;
  /** Total number of releases this recording appears on (Fame Index) */
  releaseCount: number;
  /** Number of *official* releases only (status: "Official") */
  officialReleaseCount: number;
  /** Whether this recording appears on an Album-type release-group */
  hasAlbumRelease: boolean;
  /** First release date */
  firstReleaseDate?: string;
  /** Duration in milliseconds */
  length?: number;
  /** ListenBrainz total listen count (optional enrichment) */
  listenCount?: number;
  /** The best-matching release-group (album/EP/single) this recording belongs to */
  releaseGroupId?: string;
  /** Title of the best-matching release-group */
  releaseGroupTitle?: string;
  /** The original album title (earliest official Album release-group) */
  originalAlbumTitle?: string;
  /** The original album's release date */
  originalAlbumDate?: string;
  /** Release type label for display: "Album", "Other album", "EP", "Single" */
  releaseType?: string;
  thumbnailUrl?: string; // YTMusic thumbnail
  videoId?: string; // YouTube video ID for playback
}

export type SearchResult =
  | ArtistSearchResult
  | AlbumSearchResult
  | SongSearchResult;

/** Grouped results returned when searching "all" */
export interface GroupedSearchResults {
  artists: ArtistSearchResult[];
  albums: AlbumSearchResult[];
  songs: SongSearchResult[];
}

/** API response shape */
export interface SearchApiResponse {
  results: SearchResult[];
  meta: {
    query: string;
    category: SearchCategory;
    totalResults: number;
    took: number; // ms
  };
}

// ─── Component Props ───────────────────────────────────────────────────────────

export type SearchInputSize = "small" | "large" | "compact";
export type SearchInputVariant = "light" | "dark";

export interface SearchResultsProps {
  query: string;
  isFocused: boolean;
  onClose?: () => void;
}

export interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  onClear: () => void;
  onFocus?: () => void;
  onBlur?: () => void;
  isFocused: boolean;
  placeholder?: string;
  size?: SearchInputSize;
  variant?: SearchInputVariant;
}
