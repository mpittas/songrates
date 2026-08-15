import { FaBolt } from "react-icons/fa6";

import MoodPlaylistGrid from "@/components/playlists/MoodPlaylistGrid";
import MySection from "@/components/ui/MySection";
import {
  type ApplePlaylistResult,
  type BrowsePill,
  getMoodsBrowseData,
} from "@/lib/appleMusic/api";
import { PAGE_CONTENT_TOP } from "@/lib/pageLayout";
import { cn } from "@/lib/utils";

/** ISR: regenerate moods page at most once every 6 hours. */
export const revalidate = 21600;

export const metadata = {
  title: "Moods | songrates",
  description: "Browse curated Apple Music playlists by mood.",
};

function flattenMoodPlaylists(pills: BrowsePill[]): ApplePlaylistResult[] {
  const seen = new Set<string>();
  const playlists: ApplePlaylistResult[] = [];
  const queues = pills.map((pill) => [...pill.playlists]);
  let added = true;

  while (added) {
    added = false;
    for (const queue of queues) {
      const next = queue.shift();
      if (!next) continue;
      added = true;
      if (seen.has(next.id)) continue;
      seen.add(next.id);
      playlists.push(next);
    }
  }

  return playlists;
}

export default async function MoodsPage() {
  const moods = await getMoodsBrowseData();
  const playlists = flattenMoodPlaylists(moods.pills);

  return (
    <main
      className={cn(
        "min-h-screen bg-[#F2EFED] pb-16 text-neutral-900",
        PAGE_CONTENT_TOP,
      )}
    >
      {playlists.length > 0 ? (
        <MySection className="pb-8">
          <MoodPlaylistGrid playlists={playlists} moods={moods.pills} />
        </MySection>
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
