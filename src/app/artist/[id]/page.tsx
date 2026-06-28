import { getArtistWithViews } from "@/lib/appleMusic/api";
import ArtistPageContent from "@/components/artist/ArtistPageContent";
import { mapArtistDiscographyToPageData } from "@/lib/artistPageModel";
import { resolveArtistId } from "@/lib/resolveArtistId";
import { PAGE_CONTENT_TOP } from "@/lib/pageLayout";
import { cn } from "@/lib/utils";

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

export default async function ArtistPage({ params }: PageProps) {
  const { id: slug } = await params;
  const id = resolveArtistId(slug);

  const discography = await getArtistWithViews(id);

  if (!discography) {
    return (
      <main
        className={cn(
          "flex min-h-screen items-center justify-center px-4 text-neutral-900 sm:px-6",
          PAGE_CONTENT_TOP,
        )}
      >
        <div className="font-mono text-neutral-500">Artist not found</div>
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
      essentialAlbums={pageData.essentialAlbums}
      albums={pageData.albums}
      epsAndSingles={pageData.epsAndSingles}
      appearsOn={pageData.appearsOn}
    />
  );
}
