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
}

export interface AlbumSearchResult extends SearchResultBase {
  type: "album";
  artistName?: string;
  artistId?: string;
  releaseDate?: string;
  primaryType?: string;
}

export interface SongSearchResult extends SearchResultBase {
  type: "song";
  artistName?: string;
  artistId?: string;
  /** Number of releases this recording appears on (Fame Index) */
  releaseCount: number;
  /** First release date */
  firstReleaseDate?: string;
  /** Duration in milliseconds */
  length?: number;
  /** ListenBrainz total listen count (optional enrichment) */
  listenCount?: number;
  /** The release-group (album/EP/single) this recording belongs to */
  releaseGroupId?: string;
  /** Title of the release-group */
  releaseGroupTitle?: string;
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
