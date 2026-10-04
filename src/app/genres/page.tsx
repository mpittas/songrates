import { Suspense } from "react";
import { LuLibrary } from "react-icons/lu";

import { PageHeaderSkeleton } from "@/components/layout/BrowsePageSkeleton";
import GenresBrowse from "@/components/playlists/GenresBrowse";
import EmptyState from "@/components/ui/EmptyState";
import MySection from "@/components/ui/MySection";
import PageHeader from "@/components/ui/PageHeader";
import { Skeleton } from "@/components/ui/Skeleton";
import { getCategoriesBrowseData } from "@/lib/appleMusic/api";

/** ISR: regenerate genres page at most once every 6 hours. */
export const revalidate = 21600;

export const metadata = {
  title: "Genres | songrates",
  description: "Browse Apple Music playlists by genre and style.",
};

function GenresBrowseFallback() {
  return (
    <>
      <PageHeaderSkeleton chips />
      <MySection className="pb-10">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-4 lg:grid-cols-6">
          {Array.from({ length: 12 }).map((_, i) => (
            <Skeleton key={i} className="aspect-square rounded-xl" />
          ))}
        </div>
      </MySection>
    </>
  );
}

export default async function GenresPage() {
  const categories = await getCategoriesBrowseData();
  const hasData = categories.pills.length > 0;

  return (
    <main className="min-h-screen pb-6 text-ink">
      {hasData ? (
        <Suspense fallback={<GenresBrowseFallback />}>
          <GenresBrowse pills={categories.pills} />
        </Suspense>
      ) : (
        <>
          <PageHeader eyebrow="Browse" title="Genres" />
          <MySection className="pb-16">
            <EmptyState
              icon={<LuLibrary size={22} />}
              title="Genres are warming up"
              description="Apple Music catalog data is not available right now. Please try again shortly."
            />
          </MySection>
        </>
      )}
    </main>
  );
}
