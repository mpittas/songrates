"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function SearchBar() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(searchParams.get("q") || "");

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (query.trim()) {
        router.replace(`/?q=${encodeURIComponent(query)}`);
      } else {
        router.replace("/");
      }
    }, 300); // 300ms debounce

    return () => clearTimeout(timer);
  }, [query, router]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    router.push(`/?q=${encodeURIComponent(query)}`);
  };

  return (
    <form onSubmit={handleSearch} className="w-full mb-4">
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="search_artist..."
        className="w-full bg-white/4 p-3 text-base text-white focus:outline-none focus:border-white transition-colors placeholder:text-zinc-600"
        autoFocus
      />
    </form>
  );
}
