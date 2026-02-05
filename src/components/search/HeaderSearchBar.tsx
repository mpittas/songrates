"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useSearchInput } from "@/hooks/useSearchInput";
import SearchInput from "@/components/search/SearchInput";
import SearchResults from "@/components/search/SearchResults";

export default function HeaderSearchBar() {
  const router = useRouter();
  const [showResults, setShowResults] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const {
    query,
    setQuery,
    debouncedQuery,
    isFocused,
    setIsFocused,
    clearQuery,
  } = useSearchInput();

  // Show results when we have a debounced query and input is focused
  useEffect(() => {
    setShowResults(!!debouncedQuery && isFocused);
  }, [debouncedQuery, isFocused]);

  // Click outside handler
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setShowResults(false);
        setIsFocused(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [setIsFocused]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    // Navigate to homepage with search query
    router.push(`/?q=${encodeURIComponent(query)}`);
    setShowResults(false);
    setIsFocused(false);
  };

  const handleClear = () => {
    clearQuery();
    setShowResults(false);
  };

  return (
    <div ref={containerRef} className="w-full max-w-md relative">
      <form
        onSubmit={handleSearch}
        className="w-full"
        aria-label="Search artists"
      >
        <SearchInput
          value={query}
          onChange={setQuery}
          onClear={handleClear}
          onFocus={() => setIsFocused(true)}
          isFocused={isFocused}
          placeholder="Search artists..."
          size="small"
          variant="dark"
        />
      </form>

      {/* Search Results */}
      {showResults && <SearchResults query={debouncedQuery} />}
    </div>
  );
}
