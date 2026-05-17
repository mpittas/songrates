"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useSearchInput } from "@/hooks/useSearchInput";
import SearchInput from "@/components/search/SearchInput";
import SearchResults from "@/components/search/SearchResults";

export default function HeaderSearchBar() {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);

  const {
    query,
    setQuery,
    debouncedQuery,
    isFocused,
    setIsFocused,
    clearQuery,
  } = useSearchInput();

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsFocused(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [setIsFocused]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    router.push(`/?q=${encodeURIComponent(query)}`);
    setIsFocused(false);
  };

  return (
    <div ref={containerRef} className="relative w-full max-w-md">
      <form onSubmit={handleSearch} className="w-full" aria-label="Search music">
        <SearchInput
          value={query}
          onChange={setQuery}
          onClear={() => {
            clearQuery();
            setIsFocused(true);
          }}
          onFocus={() => setIsFocused(true)}
          isFocused={isFocused}
          placeholder="Search artists, albums, songs..."
          size="small"
        />
      </form>

      {isFocused && (
        <div className="absolute top-full left-0 right-0 z-[9999] mt-2">
          <SearchResults query={debouncedQuery} />
        </div>
      )}
    </div>
  );
}
