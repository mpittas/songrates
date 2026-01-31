"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useDebouncedCallback } from "use-debounce";
import { IoSearch, IoClose } from "react-icons/io5";

export default function SearchBar() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(searchParams.get("q") || "");
  const [isFocused, setIsFocused] = useState(false);

  // Debounced search - only triggers URL update after 300ms of no typing
  const debouncedSearch = useDebouncedCallback((value: string) => {
    if (value.trim()) {
      router.replace(`/?q=${encodeURIComponent(value)}`);
    } else {
      router.replace("/");
    }
  }, 300);

  // Update debounced search when query changes
  useEffect(() => {
    debouncedSearch(query);
  }, [query, debouncedSearch]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    // Cancel pending debounce and navigate immediately on form submit
    debouncedSearch.cancel();
    router.push(`/?q=${encodeURIComponent(query)}`);
  };

  const clearSearch = () => {
    setQuery("");
    debouncedSearch.cancel();
    router.replace("/");
  };

  return (
    <form onSubmit={handleSearch} className="w-full">
      <div
        className={`
          relative flex items-center w-full
          bg-[#0a0a0d] border transition-all duration-200
          ${
            isFocused
              ? "border-[#00f0ff] shadow-[0_0_0_1px_rgba(0,240,255,0.2)]"
              : "border-[#1a1a1f] hover:border-[#2a2a35]"
          }
        `}
      >
        {/* Search Icon */}
        <div
          className={`pl-5 pr-4 transition-colors duration-200 ${
            isFocused ? "text-[#00f0ff]" : "text-neutral-600"
          }`}
        >
          <IoSearch size={20} />
        </div>

        {/* Input */}
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder="Search for artists..."
          style={{ outline: "none" }}
          className="flex-1 bg-transparent py-4 text-lg text-white placeholder:text-neutral-600 font-light focus:outline-none"
        />

        {/* Clear Button */}
        {query && (
          <button
            type="button"
            onClick={clearSearch}
            className="pr-5 pl-4 text-neutral-600 hover:text-white transition-colors"
          >
            <IoClose size={20} />
          </button>
        )}
      </div>
    </form>
  );
}
