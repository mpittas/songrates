import { LuSparkles } from "react-icons/lu";

import MoodPlaylistGrid from "@/components/playlists/MoodPlaylistGrid";
import EmptyState from "@/components/ui/EmptyState";
import MySection from "@/components/ui/MySection";
import PageHeader from "@/components/ui/PageHeader";
import {
  type ApplePlaylistResult,
  type BrowsePill,
  getMoodsBrowseData,
} from "@/lib/appleMusic/api";

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
    <main className="min-h-screen pb-10 text-ink">
      <PageHeader
        eyebrow="Browse"
        title="Moods"
        description="Playlists for every moment: workouts, late nights, rainy days and everything in between."
        tight
      />

      <MySection>
        {playlists.length > 0 ? (
          <MoodPlaylistGrid playlists={playlists} moods={moods.pills} />
        ) : (
          <EmptyState
            icon={<LuSparkles size={22} />}
            title="Moods are warming up"
            description="Apple Music catalog data is not available right now. Please try again shortly."
          />
        )}
      </MySection>
    </main>
  );
}
