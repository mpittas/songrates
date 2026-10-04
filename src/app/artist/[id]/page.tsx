import { getArtistWithViews } from "@/lib/appleMusic/api";
import ArtistPageContent from "@/components/artist/ArtistPageContent";
import { mapArtistDiscographyToPageData } from "@/lib/artistPageModel";
import { resolveArtistId } from "@/lib/resolveArtistId";
import { PAGE_CONTAINER } from "@/lib/pageLayout";
import Button from "@/components/ui/Button";
import EmptyState from "@/components/ui/EmptyState";
import { cn } from "@/lib/utils";
import type { Metadata } from "next";

/** ISR: regenerate artist pages at most once every 6 hours.
 *  Artist metadata/discography changes slowly and each rebuild fans out to Apple Music.
 *
 *  Returning [] from generateStaticParams registers this dynamic route as an
 *  ISR route on Vercel (no paths prebuilt at build time, but on-demand
 *  generation is cached and revalidated). Without this, `revalidate` is a
 *  no-op and every request is treated as fully dynamic (0% cache hit). */
export const revalidate = 21600;
export const dynamicParams = true;

export async function generateStaticParams() {
  return [];
}

interface PageProps {
  params: Promise<{ id: string }>;
}

/** noindex for the same reason as album pages: artist pages are pure Apple
 *  Music catalog mirrors. Indexing them only attracts scrapers. */
export const generateMetadata = async ({
  params,
}: PageProps): Promise<Metadata> => {
  const { id } = await params;
  return {
    title: "songrates",
    robots: { index: false, follow: false },
    alternates: {
      canonical: `/artist/${id}`,
    },
  };
};

export default async function ArtistPage({ params }: PageProps) {
  const { id: slug } = await params;
  const id = resolveArtistId(slug);

  const discography = await getArtistWithViews(id);

  if (!discography) {
    return (
      <main className={cn(PAGE_CONTAINER, "min-h-[60vh] py-16")}>
        <EmptyState
          title="Artist not found"
          description="This artist may have been removed from Apple Music."
          action={
            <Button href="/explore" variant="primary" size="md">
              Explore music
            </Button>
          }
        />
      </main>
    );
  }

  const pageData = mapArtistDiscographyToPageData(discography);

  return (
    <ArtistPageContent
      artistId={id}
      artistName={pageData.artistName}
      artistInfo={pageData.artistInfo}
      topSongs={pageData.topSongs}
      latestSongs={pageData.latestSongs}
      essentialAlbums={pageData.essentialAlbums}
      albums={pageData.albums}
      epsAndSingles={pageData.epsAndSingles}
      appearsOn={pageData.appearsOn}
    />
  );
}
