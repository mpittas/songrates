import { Suspense } from "react";
import HomeHero from "@/components/home/HomeHero";
import LatestRatedAlbums from "@/components/home/LatestRatedAlbums";
import DailyTop100Playlists from "@/components/home/DailyTop100Playlists";
import TrendingSongs from "@/components/home/TrendingSongs";
import {
  HomeGridSkeleton,
  HomeHeroSkeleton,
  HomeTrendingSkeleton,
} from "@/components/layout/HomePageSkeleton";

/** ISR: regenerate home page at most once every 6 hours.
 *  The Apple Music chart sections are slow-moving and expensive to rebuild. */
export const revalidate = 21600;

export default function Home() {
  return (
    <main className="relative flex min-h-screen flex-col pb-4 text-ink">
      <Suspense fallback={<HomeHeroSkeleton />}>
        <HomeHero />
      </Suspense>

      <Suspense fallback={<HomeTrendingSkeleton />}>
        <TrendingSongs />
      </Suspense>

      <Suspense fallback={<HomeGridSkeleton columns={6} />}>
        <DailyTop100Playlists />
      </Suspense>

      <Suspense fallback={<HomeGridSkeleton columns={4} />}>
        <LatestRatedAlbums />
      </Suspense>
    </main>
  );
}
