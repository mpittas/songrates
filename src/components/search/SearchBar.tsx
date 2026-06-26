"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useSearchInput } from "@/hooks/useSearchInput";
import { useSearchHistory } from "@/hooks/useSearchHistory";
import SearchInput from "@/components/search/SearchInput";
import SearchResults from "@/components/search/SearchResults";
import type { SearchInputVariant } from "@/types/search";

interface SearchBarProps {
  variant?: SearchInputVariant;
}

export default function SearchBar({ variant = "light" }: SearchBarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const { history, recordClick, removeClick, clearHistory } =
    useSearchHistory();

  const {
    query,
    setQuery,
    debouncedQuery,
    isFocused,
    setIsFocused,
    clearQuery,
    cancelDebounce,
  } = useSearchInput({
    initialQuery: searchParams.get("q") || "",
    onQueryChange: (_currentQuery, debouncedQuery) => {
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
    <>
      <form onSubmit={handleSearch} className="w-full relative z-[101]">
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
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
              variant={variant}
            />
          </div>
        </div>

        <div className="absolute top-full left-0 right-0 z-[200] mt-2">
          <SearchResults
            query={debouncedQuery}
            variant={variant}
            isFocused={isFocused}
            history={history}
            onRemoveClick={removeClick}
            onClearHistory={clearHistory}
            onRecordClick={recordClick}
          />
        </div>
      </form>
    </>
  );
}
