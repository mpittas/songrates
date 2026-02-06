import { useState, useEffect, useCallback, useRef } from "react";
import { useDebouncedCallback } from "use-debounce";

interface UseSearchInputOptions {
  initialQuery?: string;
  debounceMs?: number;
  onQueryChange?: (query: string, debouncedQuery: string) => void;
}

export function useSearchInput(options: UseSearchInputOptions = {}) {
  const { initialQuery = "", debounceMs = 250, onQueryChange } = options;

  const [query, setQuery] = useState(initialQuery);
  const [debouncedQuery, setDebouncedQuery] = useState(initialQuery);
  const [isFocused, setIsFocused] = useState(false);

  // Use ref to store callback to prevent infinite loops
  const onQueryChangeRef = useRef(onQueryChange);

  useEffect(() => {
    onQueryChangeRef.current = onQueryChange;
  }, [onQueryChange]);

  // Debounced search callback
  const debouncedSearch = useDebouncedCallback((value: string) => {
    setDebouncedQuery(value);
  }, debounceMs);

  // Update debounced query when query changes
  useEffect(() => {
    debouncedSearch(query);
  }, [query, debouncedSearch]);

  // Notify parent of changes if callback provided (using ref to avoid infinite loop)
  useEffect(() => {
    if (onQueryChangeRef.current) {
      onQueryChangeRef.current(query, debouncedQuery);
    }
  }, [debouncedQuery]); // Only depend on debouncedQuery, not query

  const clearQuery = useCallback(() => {
    setQuery("");
    setDebouncedQuery("");
    debouncedSearch.cancel();
  }, [debouncedSearch]);

  const cancelDebounce = useCallback(() => {
    debouncedSearch.cancel();
  }, [debouncedSearch]);

  return {
    query,
    setQuery,
    debouncedQuery,
    isFocused,
    setIsFocused,
    clearQuery,
    cancelDebounce,
  };
}
