"use client";
import SearchBar from "@/components/SearchBar";
import ArtistList from "@/components/ArtistList";
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

  return (
    <>
      {loading ? (
        <div className="text-center text-zinc-600 animate-pulse">
          searching...
        </div>
      ) : (
        <ArtistList artists={artists} />
        // temp
      )}
    </>
  );
}

export default function Home() {
  return (
    <main className="min-h-screen bg-black text-zinc-100 p-8 md:p-24 font-light">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl md:text-6xl font-thin mb-16 text-center tracking-tight">
          songrates
        </h1>

        <SearchBar />

        <Suspense fallback={null}>
          <SearchResults />
        </Suspense>
      </div>
    </main>
  );
}
