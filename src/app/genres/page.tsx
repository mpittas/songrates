import { Suspense } from "react";
import { FaCompactDisc } from "react-icons/fa6";

import GenresBrowse from "@/components/playlists/GenresBrowse";
import MySection from "@/components/ui/MySection";
import { getCategoriesBrowseData } from "@/lib/appleMusic/api";
import { PAGE_CONTENT_TOP } from "@/lib/pageLayout";
import { cn } from "@/lib/utils";

/** ISR: regenerate genres page at most once every 6 hours. */
export const revalidate = 21600;

export const metadata = {
  title: "Genres | songrates",
  description: "Browse Apple Music playlists by genre and style.",
};

function GenresBrowseFallback() {
  return (
    <div>
      <div className="flex items-end justify-between gap-4">
        <div className="h-11 w-40 animate-pulse rounded-md bg-neutral-900/10" />
        <div className="h-4 w-20 animate-pulse rounded bg-neutral-900/10" />
      </div>
      <div className="mt-8 grid grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-3 md:grid-cols-4 lg:grid-cols-6">
        {Array.from({ length: 12 }).map((_, i) => (
          <div
            key={i}
            className="aspect-square animate-pulse rounded-xl bg-neutral-900/10"
          />
        ))}
      </div>
    </div>
  );
}

export default async function GenresPage() {
  const categories = await getCategoriesBrowseData();
  const hasData = categories.pills.length > 0;

  return (
    <main
      className={cn(
        "min-h-screen bg-[#F2EFED] pb-16 text-neutral-900",
        PAGE_CONTENT_TOP,
      )}
    >
      <MySection className="pb-8">
        {hasData ? (
          <Suspense fallback={<GenresBrowseFallback />}>
            <GenresBrowse pills={categories.pills} />
          </Suspense>
        ) : (
          <div className="rounded-2xl border border-neutral-200 bg-white p-8 text-center">
            <FaCompactDisc className="mx-auto text-neutral-400" size={28} />
            <h2 className="mt-4 text-xl font-semibold text-neutral-900">
              Genres are warming up
            </h2>
            <p className="mx-auto mt-2 max-w-lg text-sm text-neutral-500">
              Apple Music catalog data is not available right now. Please try
              again shortly.
            </p>
          </div>
        )}
      </MySection>
    </main>
  );
}
