import { FaBolt } from "react-icons/fa6";

import BrowseSectionClient from "@/components/playlists/BrowseSectionClient";
import MoodsHero from "@/components/playlists/MoodsHero";
import MySection from "@/components/ui/MySection";
import { countPlaylists, pickHeroArtworks } from "@/lib/browseHero";
import { getBrowseData } from "@/lib/appleMusic/api";

/** ISR: regenerate moods page at most once every 6 hours. */
export const revalidate = 21600;

export const metadata = {
  title: "Moods | songrates",
  description: "Browse curated Apple Music playlists by mood.",
};

export default async function MoodsPage() {
  const data = await getBrowseData();
  const { moods } = data;
  const hasData = moods.pills.length > 0;

  return (
    <main className="min-h-screen bg-[#F2EFED] pb-16 text-neutral-900">
      <MoodsHero
        moodCount={hasData ? moods.pills.length : undefined}
        totalPlaylists={hasData ? countPlaylists(moods.pills) : undefined}
        heroArtworks={pickHeroArtworks(moods.pills, 4)}
      />

      {hasData ? (
        <BrowseSectionClient section={moods} />
      ) : (
        <MySection className="py-16">
          <div className="rounded-2xl border border-neutral-200 bg-white p-8 text-center">
            <FaBolt className="mx-auto text-neutral-400" size={28} />
            <h2 className="mt-4 text-xl font-semibold text-neutral-900">
              Moods are warming up
            </h2>
            <p className="mx-auto mt-2 max-w-lg text-sm text-neutral-500">
              Apple Music catalog data is not available right now. Please try
              again shortly.
            </p>
          </div>
        </MySection>
      )}
    </main>
  );
}
