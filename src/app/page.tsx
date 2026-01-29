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
    <div className="absolute top-full left-0 right-0 mt-4 bg-[#000000] border border-zinc-800 rounded-lg shadow-2xl z-50 max-h-[500px] overflow-y-auto">
      {loading ? (
        <div className="text-center text-zinc-600 animate-pulse py-8">
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
    <main className="min-h-screen bg-[#0a0a0a] text-zinc-100 p-4 font-sans">
      <div className="max-w-xl mx-auto mt-10">
        {/* Search Container - relative positioning for absolute dropdown */}
        <div className="relative mb-8">
          <SearchBar />
          <Suspense fallback={null}>
            <SearchResults />
          </Suspense>
        </div>

        {/* Recent Artists Section */}
        <div className="bg-zinc-950/30">
          <RecentArtists />
        </div>
      </div>
    </main>
  );
}
