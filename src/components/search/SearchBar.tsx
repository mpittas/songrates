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
      {/* Mobile Overlay Background (when focused) */}
      {isFocused && (
        <div className="fixed inset-0 z-[100] bg-[#050507]/95 backdrop-blur-sm md:hidden" />
      )}

      <form
        onSubmit={handleSearch}
        className={`w-full transition-all duration-300 ${
          isFocused
            ? "fixed inset-0 z-[101] bg-[#050507] p-4 flex flex-col gap-4 md:relative md:p-0 md:bg-transparent md:block"
            : "relative"
        }`}
      >
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <SearchInput
              value={query}
              onChange={setQuery}
              onClear={handleClear}
              onFocus={() => setIsFocused(true)}
              onBlur={() => {
                // Small delay to allow clicking on results
                // On mobile we might want to keep it open until explicit cancel/select
                // But for now keep behavior consistent
                setTimeout(() => setIsFocused(false), 200);
              }}
              isFocused={isFocused}
              placeholder="Search artists, albums, songs..."
              size="large"
              variant="light"
            />
          </div>

          {/* Mobile Cancel Button */}
          {isFocused && (
            <button
              type="button"
              onClick={() => {
                setIsFocused(false);
                clearQuery();
              }}
              className="text-neutral-400 font-mono text-xs uppercase tracking-wider md:hidden whitespace-nowrap"
            >
              Cancel
            </button>
          )}
        </div>

        <div
          className={`${isFocused ? "flex-1 overflow-y-auto mt-2 md:mt-0 md:overflow-visible" : ""}`}
        >
          <SearchResults
            query={debouncedQuery}
            isFocused={isFocused}
            onClose={() => setIsFocused(false)}
            mobileMode={isFocused} // Pass mobile mode flag
          />
        </div>
      </form>
    </>
  );
}
