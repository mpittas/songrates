"use client";
import SearchBar from "@/components/SearchBar";
import ArtistList from "@/components/artist/ArtistList";
import RecentArtists from "@/components/artist/RecentArtists";
import MeshGradientBackground from "@/components/mesh/MeshGradientWrap";
import MySection from "@/components/MySection";
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
    <div className="absolute top-full left-0 right-0 mt-0 bg-[#0a0a0d] border-x border-b border-[#1a1a1f] z-50 max-h-[400px] overflow-y-auto">
      {loading ? (
        <div className="flex items-center justify-center py-12 text-neutral-600 font-mono text-sm tracking-widest uppercase">
          <span>Searching...</span>
        </div>
      ) : (
        <ArtistList artists={artists} />
      )}
    </div>
  );
}

export default function Home() {
  return (
    <main className="min-h-screen text-neutral-100 flex flex-col relative -mt-12">
      <div className="absolute top-0 left-0 right-0 h-[500px] z-0 overflow-hidden">
        <MeshGradientBackground />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#050507]" />
      </div>

      <MySection className="flex-1 flex flex-col justify-center relative z-10 pt-20 pb-12">
        <div className="flex flex-col items-center justify-center w-full">
          <div className="text-center mb-16 space-y-6">
            <h1 className="text-6xl md:text-8xl font-light tracking-tighter text-white">
              Discover Music
              <br />
              <span className="text-neutral-500 block text-4xl md:text-6xl mt-2 font-thin">
                Rate & Review
              </span>
            </h1>
            <p className="text-neutral-500 text-lg md:text-xl max-w-xl mx-auto font-light tracking-wide">
              Your personal space to track, rate, and discover.
            </p>
          </div>

          <div className="w-full relative z-10">
            <Suspense fallback={null}>
              <SearchBar />
            </Suspense>
            <div className="relative">
              <Suspense fallback={null}>
                <SearchResults />
              </Suspense>
            </div>
          </div>
        </div>
      </MySection>

      <MySection className="pb-20 relative z-10">
        <div className="border-t border-neutral-900/50 pt-10">
          <RecentArtists />
        </div>
      </MySection>
    </main>
  );
}
