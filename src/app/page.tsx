"use client";
import SearchBar from "@/components/SearchBar";
import ArtistList from "@/components/ArtistList";
import RecentArtists from "@/components/RecentArtists";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

function SearchResults() {
  const searchParams = useSearchParams();
  const query = searchParams.get("q");
  const [artists, setArtists] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!query) {
      setArtists([]);
      return;
    }

    setLoading(true);
    fetch(`/api/musicbrainz/artist?query=${query}`)
      .then((res) => res.json())
      .then((data) => setArtists(data.artists))
      .finally(() => setLoading(false));
  }, [query]);

  if (!query) return null;

  return (
    <div className="absolute top-full left-0 right-0 mt-2 bg-[#0a0a0d] border border-[#1a1a1f] shadow-2xl z-50 max-h-[400px] overflow-y-auto">
      {loading ? (
        <div className="text-center text-neutral-600 py-8 font-mono text-sm">
          searching...
        </div>
      ) : (
        <ArtistList artists={artists} />
      )}
    </div>
  );
}

export default function Home() {
  return (
    <main className="min-h-screen bg-[#050507] text-neutral-100">
      <div className="max-w-lg mx-auto pt-24 px-6">
        <div className="relative mb-12">
          <Suspense fallback={null}>
            <SearchBar />
          </Suspense>
          <Suspense fallback={null}>
            <SearchResults />
          </Suspense>
        </div>

        <RecentArtists />
      </div>
    </main>
  );
}
