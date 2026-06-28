import { useState, useEffect, useCallback, useRef } from "react";
import { useDebouncedCallback } from "use-debounce";

interface UseSearchInputOptions {
  initialQuery?: string;
  debounceMs?: number;
  onQueryChange?: (query: string, debouncedQuery: string) => void;
}

export function useSearchInput(options: UseSearchInputOptions = {}) {
  const { initialQuery = "", debounceMs = 400, onQueryChange } = options;

  const [query, setQuery] = useState(initialQuery);
  const [debouncedQuery, setDebouncedQuery] = useState(initialQuery);
  const [isFocused, setIsFocused] = useState(false);

  // Use ref to store callback to prevent infinite loops
  const onQueryChangeRef = useRef(onQueryChange);
  const queryRef = useRef(query);

  useEffect(() => {
    onQueryChangeRef.current = onQueryChange;
  }, [onQueryChange]);

  useEffect(() => {
    queryRef.current = query;
  }, [query]);

  // Debounced search callback
  // - trailing: true (default) → fires after debounce period with final value
  // - maxWait → guarantees callback fires within this time even during rapid typing
  // NOTE: leading:true was removed because it fires partial queries (e.g. "k")
  // that may return 0 results, causing a flash of "no results found".
  const debouncedSearch = useDebouncedCallback(
    (value: string) => {
      setDebouncedQuery(value.trim());
    },
    debounceMs,
    { maxWait: debounceMs * 2 },
  );

  // Update debounced query when query changes
  useEffect(() => {
    debouncedSearch(query);
  }, [query, debouncedSearch]);

  // Notify parent of changes if callback provided (using ref to avoid infinite loop)
  useEffect(() => {
    if (onQueryChangeRef.current) {
      onQueryChangeRef.current(queryRef.current, debouncedQuery);
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
