"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useSearchInput } from "@/hooks/useSearchInput";
import SearchInput from "@/components/search/SearchInput";

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
      <SearchInput
        value={query}
        onChange={setQuery}
        onClear={handleClear}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        isFocused={isFocused}
        placeholder="Search for artists..."
        size="large"
        variant="light"
      />
    </form>
  );
}
