"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { IoSearch } from "react-icons/io5";

export default function SearchBar() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(searchParams.get("q") || "");
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (query.trim()) {
        router.replace(`/?q=${encodeURIComponent(query)}`);
      } else {
        router.replace("/");
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query, router]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    router.push(`/?q=${encodeURIComponent(query)}`);
  };

  return (
    <form onSubmit={handleSearch} className="w-full relative group">
      <div
        className={`
          flex items-center w-full transition-all duration-300 ease-out
          backdrop-blur-xl border
          ${
            isFocused
              ? "bg-[#0a0a0d]/90 border-[#00f0ff]/50 shadow-[0_0_40px_-10px_rgba(0,240,255,0.3)]"
              : "bg-[#0a0a0d]/60 border-white/10 hover:border-white/20 hover:bg-[#0a0a0d]/80"
          }
        `}
      >
        <div
          className={`pl-8 pr-6 transition-colors duration-300 ${
            isFocused ? "text-[#00f0ff]" : "text-neutral-500"
          }`}
        >
          <IoSearch size={24} />
        </div>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder="Search for artists..."
          style={{ boxShadow: "none", outline: "none" }}
          className="w-full bg-transparent border-none appearance-none focus:ring-0 focus:outline-none py-6 text-xl md:text-2xl text-white placeholder:text-neutral-700 font-light tracking-tight"
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery("")}
            className="px-8 text-neutral-600 hover:text-[#00f0ff] transition-colors"
          >
            <div className="text-[10px] font-mono uppercase tracking-widest hidden md:block border border-transparent hover:border-[#00f0ff]/30 px-2 py-1">
              Clear
            </div>
            <div className="md:hidden">×</div>
          </button>
        )}
      </div>
      {/* Decorative corner accents when focused */}
      <div
        className={`absolute top-0 left-0 w-2 h-2 border-t border-l border-[#00f0ff] transition-opacity duration-300 pointer-events-none ${
          isFocused ? "opacity-100" : "opacity-0"
        }`}
      />
      <div
        className={`absolute top-0 right-0 w-2 h-2 border-t border-r border-[#00f0ff] transition-opacity duration-300 pointer-events-none ${
          isFocused ? "opacity-100" : "opacity-0"
        }`}
      />
      <div
        className={`absolute bottom-0 left-0 w-2 h-2 border-b border-l border-[#00f0ff] transition-opacity duration-300 pointer-events-none ${
          isFocused ? "opacity-100" : "opacity-0"
        }`}
      />
      <div
        className={`absolute bottom-0 right-0 w-2 h-2 border-b border-r border-[#00f0ff] transition-opacity duration-300 pointer-events-none ${
          isFocused ? "opacity-100" : "opacity-0"
        }`}
      />
    </form>
  );
}
