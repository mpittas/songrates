import { Suspense } from "react";
import HomeHero from "@/components/home/HomeHero";
import LatestRatedAlbums from "@/components/home/LatestRatedAlbums";
import DailyTop100Playlists from "@/components/home/DailyTop100Playlists";
import TrendingSongs from "@/components/home/TrendingSongs";
import MySection from "@/components/ui/MySection";

/** ISR: regenerate home page at most once every 6 hours.
 *  The Apple Music chart sections are slow-moving and expensive to rebuild. */
export const revalidate = 21600;

function HomeHeroFallback() {
  return (
    <section className="relative flex flex-col bg-[#0a0a0a]">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,#2c2624_0%,#161312_48%,#070707_100%)]" />
      <div className="relative z-10 flex flex-col items-center px-4 pt-8 pb-6 sm:pt-10 sm:pb-8">
        <div className="mx-auto h-10 w-3/4 max-w-2xl bg-white/10 sm:h-14" />
        <div className="mx-auto mt-5 h-14 w-full max-w-[640px] rounded-xl bg-white/10" />
      </div>
      <div className="relative z-10 flex gap-1.5 overflow-hidden px-1.5 pb-5">
        {Array.from({ length: 8 }).map((_, index) => (
          <div
            key={index}
            className="size-24 shrink-0 bg-white/5 sm:size-28"
          />
        ))}
      </div>
    </section>
  );
}

function HomeGridFallback() {
  return (
    <section className="py-12 sm:py-14">
      <MySection>
        <div className="w-full animate-pulse">
          <div className="h-6 w-52 rounded bg-neutral-900/10" />
          <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            {Array.from({ length: 5 }).map((_, index) => (
              <div
                key={index}
                className="aspect-square rounded-xl border border-black/5 bg-white/60"
              />
            ))}
          </div>
        </div>
      </MySection>
    </section>
  );
}

function TrendingSongsFallback() {
  return (
    <section className="py-12 sm:py-14">
      <MySection>
        <div className="w-full">
          <div className="flex items-end justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="h-6 w-44 bg-neutral-900/10 rounded animate-pulse" />
              <div className="h-5 w-28 bg-neutral-900/10 rounded-full animate-pulse" />
            </div>
            <div className="h-4 w-12 bg-neutral-900/10 rounded animate-pulse" />
          </div>

          <div className="mt-6 flex flex-col gap-1.5 sm:gap-2">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="h-12 sm:h-14 bg-white/60 border border-black/5 rounded-md animate-pulse"
              />
            ))}
          </div>
        </div>
      </MySection>
    </section>
  );
}

export default function Home() {
  return (
    <main className="min-h-screen text-neutral-900 flex flex-col relative bg-[#F2EFED] pb-14">
      <Suspense fallback={<HomeHeroFallback />}>
        <HomeHero />
      </Suspense>

      <Suspense
        fallback={
          <TrendingSongsFallback />
        }
      >
        <TrendingSongs />
      </Suspense>

      <Suspense fallback={<HomeGridFallback />}>
        <DailyTop100Playlists />
      </Suspense>

      <Suspense fallback={<HomeGridFallback />}>
        <LatestRatedAlbums />
      </Suspense>
    </main>
  );
}
