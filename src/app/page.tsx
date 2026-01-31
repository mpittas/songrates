"use client";
import SearchBar from "@/components/SearchBar";
import SearchResults from "@/components/SearchResults";
import ArtistList from "@/components/artist/ArtistList";
import RecentArtists from "@/components/artist/RecentArtists";
import MeshGradientBackground from "@/components/mesh/MeshGradientWrap";
import MySection from "@/components/MySection";
import { Suspense, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";

function SearchResultsWrapper() {
  const searchParams = useSearchParams();
  const query = searchParams.get("q") || "";

  return <SearchResults query={query} />;
}

function HomeContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  // Close search results when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      // Check if search query exists
      if (!searchParams.get("q")) return;

      const target = e.target as HTMLElement;
      // If click is NOT inside the search container (z-[100] div)
      if (!target.closest(".z-\\[100\\]")) {
        const newParams = new URLSearchParams(searchParams.toString());
        newParams.delete("q");
        router.replace(`/?${newParams.toString()}`);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [searchParams, router]);

  return (
    <main className="min-h-screen text-neutral-100 flex flex-col relative">
      <div className="absolute top-0 left-0 right-0 h-[400px] z-0 overflow-hidden -mt-12">
        <MeshGradientBackground />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#050507]" />
      </div>

      <MySection className="relative z-20 pt-24 pb-12">
        <div className="flex flex-col items-center justify-center w-full">
          <div className="text-center mb-16 space-y-6">
            <h1 className="text-6xl md:text-8xl font-light tracking-tighter text-white">
              Discover Music
            </h1>
            <p className="text-white/60 text-lg md:text-xl max-w-xl mx-auto font-light tracking-wide">
              Your personal space to track, rate, and discover.
            </p>
          </div>

          <div className="w-full relative z-[100]">
            <Suspense fallback={null}>
              <SearchBar />
            </Suspense>
            <Suspense fallback={null}>
              <SearchResultsWrapper />
            </Suspense>
          </div>
        </div>
      </MySection>

      <MySection className="pb-20 relative z-0">
        <div>
          <RecentArtists />
        </div>
      </MySection>
    </main>
  );
}

export default function Home() {
  return (
    <Suspense fallback={null}>
      <HomeContent />
    </Suspense>
  );
}
