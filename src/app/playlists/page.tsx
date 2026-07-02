import { FaListUl } from "react-icons/fa6";

import BrowseSectionClient from "@/components/playlists/BrowseSectionClient";
import PlaylistsHero from "@/components/playlists/PlaylistsHero";
import MySection from "@/components/ui/MySection";
import { countPlaylists, pickHeroArtworks } from "@/lib/browseHero";
import { getCategoriesBrowseData } from "@/lib/appleMusic/api";

/** ISR: regenerate playlists page at most once every 6 hours. */
export const revalidate = 21600;

export const metadata = {
  title: "Playlists | songrates",
  description: "Browse curated Apple Music playlists by genre.",
};

export default async function PlaylistsPage() {
  const categories = await getCategoriesBrowseData();
  const hasData = categories.pills.length > 0;

  return (
    <main className="min-h-screen bg-[#F2EFED] pb-16 text-neutral-900">
      <PlaylistsHero
        categoryCount={hasData ? categories.pills.length : undefined}
        totalPlaylists={hasData ? countPlaylists(categories.pills) : undefined}
        heroArtworks={pickHeroArtworks(categories.pills, 4)}
      />

      {hasData ? (
        <BrowseSectionClient section={categories} />
      ) : (
        <MySection className="py-16">
          <div className="rounded-2xl border border-neutral-200 bg-white p-8 text-center">
            <FaListUl className="mx-auto text-neutral-400" size={28} />
            <h2 className="mt-4 text-xl font-semibold text-neutral-900">
              Playlists are warming up
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
