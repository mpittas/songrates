"use client";
import SearchBar from "@/components/search/SearchBar";
import MeshGradientBackground from "@/components/mesh/MeshGradientWrap";
import MySection from "@/components/ui/MySection";
import { Suspense } from "react";

function HomeContent() {
  return (
    <main className="min-h-screen text-neutral-100 flex flex-col relative">
      <div className="absolute top-0 left-0 right-0 h-[400px] z-0 overflow-hidden -mt-17">
        <MeshGradientBackground />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#050507]" />
      </div>

      <MySection className="relative z-20 pt-24 pb-12">
        <div className="flex flex-col items-center justify-center w-full">
          <div className="text-center mb-16 space-y-6">
            <h1 className="text-4xl md:text-6xl lg:text-8xl font-light tracking-tighter text-white px-4">
              Discover Music
            </h1>
            <p className="text-white/60 text-base md:text-lg lg:text-xl max-w-xl mx-auto font-light tracking-wide px-4">
              Rate albums and individual tracks. Explore studio albums, EPs, and
              Singles & Features.
            </p>
          </div>

          <div className="w-full relative z-[100]">
            <Suspense fallback={null}>
              <SearchBar />
            </Suspense>
          </div>
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
