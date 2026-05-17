// ─── Search Filter Types ───────────────────────────────────────────────────────

/** The user-facing search categories */
export type SearchCategory = "all" | "artist" | "album" | "song";

// ─── Search Result Types ───────────────────────────────────────────────────────

export interface SearchResultBase {
  id: string;
  type: Exclude<SearchCategory, "all">;
  title: string;
  subtitle?: string;
  artworkUrl?: string;
}

export interface ArtistSearchResult extends SearchResultBase {
  type: "artist";
  genres?: string[];
}

export interface AlbumSearchResult extends SearchResultBase {
  type: "album";
  artistName?: string;
  artistId?: string;
  releaseDate?: string;
  /** "Album" | "EP" | "Single" | "Compilation" */
  albumType?: string;
}

export interface SongSearchResult extends SearchResultBase {
  type: "song";
  artistName?: string;
  artistId?: string;
  albumName?: string;
  albumId?: string;
  /** Duration in milliseconds */
  durationMs?: number;
  releaseDate?: string;
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
export type SearchInputVariant = "light" | "dark" | "glass";

export interface SearchResultsProps {
  query: string;
  variant?: SearchInputVariant;
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
