import type { ReactNode } from "react";
import { FaListUl } from "react-icons/fa6";
import MySection from "@/components/ui/MySection";
import OptimizedImage from "@/components/ui/OptimizedImage";
import PlaylistsBrowserClient from "@/components/playlists/PlaylistsBrowserClient";
import {
  artworkUrl,
  getBrowseData,
  type AppleBrowseData,
} from "@/lib/appleMusic/api";

/** ISR: regenerate playlists page at most once every 6 hours.
 *  getBrowseData fires 16 parallel Apple Music search calls per regeneration,
 *  so a longer window keeps Vercel compute costs down. Browse content is slow-moving. */
export const revalidate = 21600;

export const metadata = {
  title: "Playlists | songrates",
  description: "Browse curated Apple Music playlists by mood and category.",
};

/** Pick a few distinct playlist covers for the hero strip. */
function pickHeroArtworks(data: AppleBrowseData, count = 5): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const pill of [...data.moods.pills, ...data.categories.pills]) {
    for (const playlist of pill.playlists) {
      if (playlist.artworkUrl && !seen.has(playlist.id)) {
        seen.add(playlist.id);
        out.push(artworkUrl(playlist.artworkUrl, 300));
        if (out.length >= count) return out;
      }
    }
  }
  return out;
}

function StatChip({ children }: { children: ReactNode }) {
  return (
    <span className="rounded-full border border-black/10 bg-white px-3 py-1 text-xs font-medium text-neutral-600">
      {children}
    </span>
  );
}

export default async function PlaylistsPage() {
  const data = await getBrowseData();
  const hasData =
    data.moods.pills.length > 0 || data.categories.pills.length > 0;

  const moodCount = data.moods.pills.length;
  const categoryCount = data.categories.pills.length;
  const totalPlaylists = [
    ...data.moods.pills,
    ...data.categories.pills,
  ].reduce((sum, pill) => sum + pill.playlists.length, 0);

  const heroArtworks = pickHeroArtworks(data, 4);

  return (
    <main className="min-h-screen bg-[#F2EFED] pb-16 text-neutral-900">
      <section className="px-2 pt-2">
        <div className="relative rounded-2xl border border-black/5 bg-white shadow-[0_1px_0_rgba(0,0,0,0.04)]">
          <MySection className="relative z-10 py-5 sm:py-6">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between sm:gap-8">
              <div className="min-w-0 flex-1">
                <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-neutral-900 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-white">
                  <FaListUl size={12} />
                  Playlists
                </div>
                <h1 className="text-2xl font-semibold tracking-tight text-neutral-950 sm:text-3xl">
                  Browse by mood &amp; genre
                </h1>
                <p className="mt-2 max-w-lg text-sm leading-6 text-neutral-600">
                  Curated playlists for every moment and style.
                </p>

                {hasData && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    <StatChip>{moodCount} moods</StatChip>
                    <StatChip>{categoryCount} categories</StatChip>
                    <StatChip>{totalPlaylists} playlists</StatChip>
                  </div>
                )}
              </div>

              {heroArtworks.length > 0 && (
                <div className="flex shrink-0 items-center gap-2 overflow-x-auto pb-0.5 [scrollbar-width:none] sm:gap-2.5 [&::-webkit-scrollbar]:hidden">
                  {heroArtworks.map((src, i) => (
                    <div
                      key={i}
                      className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg border border-black/5 bg-neutral-100 shadow-sm sm:h-16 sm:w-16"
                    >
                      <OptimizedImage
                        src={src}
                        alt="Playlist cover"
                        fill
                        priority={i < 3}
                        className="object-cover"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </MySection>
        </div>
      </section>

      {hasData ? (
        <PlaylistsBrowserClient data={data} />
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
