import { Suspense } from "react";
import HomeHero from "@/components/home/HomeHero";
import LatestRatedAlbums from "@/components/home/LatestRatedAlbums";

export default function Home() {
  return (
    <main className="min-h-screen text-neutral-100 flex flex-col relative">
      <Suspense fallback={null}>
        <HomeHero />
      </Suspense>

      <Suspense
        fallback={
          <div className="h-64 flex items-center justify-center text-neutral-600 text-xs tracking-widest uppercase">
            Loading feeds...
          </div>
        }
      >
        <LatestRatedAlbums
          filterType="Album"
          sectionTitle="Latest Community Ratings"
        />
      </Suspense>

      <Suspense
        fallback={
          <div className="h-64 flex items-center justify-center text-neutral-600 text-xs tracking-widest uppercase">
            Loading feeds...
          </div>
        }
      >
        <LatestRatedAlbums filterType="EP" sectionTitle="Latest Rated EPs" />
      </Suspense>
    </main>
  );
}
