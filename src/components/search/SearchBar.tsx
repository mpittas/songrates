"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useSearchInput } from "@/hooks/useSearchInput";
import SearchInput from "@/components/search/SearchInput";
import SearchResults from "@/components/search/SearchResults";

export default function SearchBar() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const {
    query,
    setQuery,
    isFocused,
    setIsFocused,
    clearQuery,
    cancelDebounce,
  } = useSearchInput({
    initialQuery: searchParams.get("q") || "",
    onQueryChange: (currentQuery, debouncedQuery) => {
      // Update URL when query changes (debounced)
      if (debouncedQuery.trim()) {
        router.replace(`/?q=${encodeURIComponent(debouncedQuery)}`);
      } else {
        router.replace("/");
      }
    },
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    // Cancel pending debounce and navigate immediately on form submit
    cancelDebounce();
    router.push(`/?q=${encodeURIComponent(query)}`);
  };

  const handleClear = () => {
    clearQuery();
    router.replace("/");
  };

  return (
    <form onSubmit={handleSearch} className="w-full">
      <div className="relative">
        <SearchInput
          value={query}
          onChange={setQuery}
          onClear={handleClear}
          onFocus={() => setIsFocused(true)}
          onBlur={() => {
            // Small delay to allow clicking on results
            setTimeout(() => setIsFocused(false), 200);
          }}
          isFocused={isFocused}
          placeholder="Search artists, albums, songs..."
          size="large"
          variant="light"
        />
        <SearchResults
          query={query}
          isFocused={isFocused}
          onClose={() => setIsFocused(false)}
        />
      </div>
    </form>
  );
}
