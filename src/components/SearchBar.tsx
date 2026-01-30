"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function SearchBar() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(searchParams.get("q") || "");

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
    <form onSubmit={handleSearch} className="w-full">
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="search artist..."
          className="w-full bg-transparent border-b border-[#1a1a1f] py-4 text-lg text-neutral-200 focus:outline-none placeholder:text-neutral-600 font-light tracking-wide"
          autoFocus
        />
        <span className="absolute right-0 top-1/2 -translate-y-1/2 font-mono text-xs text-neutral-600">
          ↵
        </span>
      </div>
    </form>
  );
}
