"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function SearchBar() {
  const [query, setQuery] = useState("");
  const router = useRouter();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    router.push(`/?q=${encodeURIComponent(query)}`);
  };

  return (
    <form onSubmit={handleSearch} className="w-full max-w-lg mx-auto mb-12">
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search for an artist..."
        className="w-full bg-transparent border-b border-zinc-700 py-2 text-xl text-center text-white focus:outline-none focus:border-white transition-colors placeholder:text-zinc-600"
        autoFocus
      />
    </form>
  );
}
