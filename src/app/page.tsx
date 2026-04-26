import { Suspense } from "react";
import HomeHero from "@/components/home/HomeHero";
import LatestRatedAlbums from "@/components/home/LatestRatedAlbums";
import DailyTop100Playlists from "@/components/home/DailyTop100Playlists";
import TrendingSongs from "@/components/home/TrendingSongs";

export default function Home() {
  return (
    <main className="min-h-screen text-neutral-900 flex flex-col relative">
      <Suspense fallback={null}>
        <HomeHero />
      </Suspense>

      <Suspense
        fallback={
          <div className="h-64 flex items-center justify-center text-neutral-600 text-xs tracking-widest uppercase">
            Loading trending songs...
          </div>
        }
      >
        <TrendingSongs />
      </Suspense>

      <Suspense
        fallback={
          <div className="h-64 flex items-center justify-center text-neutral-600 text-xs tracking-widest uppercase">
            Loading playlists...
          </div>
        }
      >
        <DailyTop100Playlists />
      </Suspense>

      <Suspense
        fallback={
          <div className="h-64 flex items-center justify-center text-neutral-600 text-xs tracking-widest uppercase">
            Loading feeds...
          </div>
        }
      >
        <LatestRatedAlbums />
      </Suspense>
    </main>
  );
}
