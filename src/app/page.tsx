import { Suspense } from "react";
import HomeHero from "@/components/home/HomeHero";
import LatestRatedAlbums from "@/components/home/LatestRatedAlbums";
import DailyTop100Playlists from "@/components/home/DailyTop100Playlists";
import TrendingSongs from "@/components/home/TrendingSongs";

/** ISR: regenerate home page at most once every 6 hours.
 *  The Apple Music chart sections are slow-moving and expensive to rebuild. */
export const revalidate = 21600;

function TrendingSongsFallback() {
  return (
    <section className="py-12 sm:py-14">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="w-full">
          <div className="flex items-end justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="h-6 w-44 bg-neutral-900/10 rounded animate-pulse" />
              <div className="h-5 w-28 bg-neutral-900/10 rounded-full animate-pulse" />
            </div>
            <div className="h-4 w-12 bg-neutral-900/10 rounded animate-pulse" />
          </div>

          <div className="mt-6 flex flex-col gap-2">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="h-12 sm:h-14 bg-white/60 border border-black/5 rounded-md animate-pulse"
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export default function Home() {
  return (
    <main className="min-h-screen text-neutral-900 flex flex-col relative bg-[#F2EFED] pb-14">
      <Suspense fallback={null}>
        <HomeHero />
      </Suspense>

      <Suspense
        fallback={
          <TrendingSongsFallback />
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
