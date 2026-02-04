import { Artist } from "./artist";
import { Album } from "./music";

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
