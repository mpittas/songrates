"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useSearchInput } from "@/hooks/useSearchInput";
import { useSearchHistory } from "@/hooks/useSearchHistory";
import SearchInput from "@/components/search/SearchInput";
import SearchResults from "@/components/search/SearchResults";

function isTypingTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false;
  return (
    target.isContentEditable ||
    target.tagName === "INPUT" ||
    target.tagName === "TEXTAREA" ||
    target.tagName === "SELECT"
  );
}

export default function HeaderSearchBar({
  autoFocus = false,
}: {
  autoFocus?: boolean;
}) {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const {
    query,
    setQuery,
    debouncedQuery,
    isFocused,
    setIsFocused,
    clearQuery,
  } = useSearchInput();

  const { history, recordClick, removeClick, clearHistory } =
    useSearchHistory();

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

  // "/" focuses the search field from anywhere on the page.
  useEffect(() => {
    if (autoFocus) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "/" || e.metaKey || e.ctrlKey || e.altKey) return;
      if (isTypingTarget(e.target)) return;
      const input = inputRef.current;
      if (!input || input.offsetParent === null) return;
      e.preventDefault();
      input.focus();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [autoFocus]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    router.push(`/?q=${encodeURIComponent(query)}`);
    setIsFocused(false);
  };

  return (
    <div ref={containerRef} className="relative w-full">
      <form
        onSubmit={handleSearch}
        className="w-full"
        role="search"
        aria-label="Search music"
      >
        <SearchInput
          value={query}
          onChange={setQuery}
          onClear={() => {
            clearQuery();
            setIsFocused(true);
            inputRef.current?.focus();
          }}
          onFocus={() => setIsFocused(true)}
          isFocused={isFocused}
          placeholder="Search artists, albums, songs"
          size="small"
          autoFocus={autoFocus}
          inputRef={inputRef}
          shortcutHint={autoFocus ? undefined : "/"}
        />
      </form>

      {isFocused && (
        <div className="absolute top-full right-0 left-0 z-[9999] mt-2 md:left-auto md:w-[min(28rem,calc(100vw-2rem))]">
          <SearchResults
            query={debouncedQuery}
            isFocused={isFocused}
            history={history}
            onRemoveClick={removeClick}
            onClearHistory={clearHistory}
            onRecordClick={recordClick}
          />
        </div>
      )}
    </div>
  );
}
