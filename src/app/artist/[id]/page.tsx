import {
  getArtistWithViews,
  getArtistFullAlbums,
  getArtistSingles,
} from "@/lib/appleMusic/api";
import ArtistPageContent from "@/components/artist/ArtistPageContent";
import { mapArtistDiscographyToPageData } from "@/lib/artistPageModel";
import { resolveArtistId } from "@/lib/resolveArtistId";
import { PAGE_CONTENT_TOP } from "@/lib/pageLayout";
import { cn } from "@/lib/utils";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ArtistPage({ params }: PageProps) {
  const { id: slug } = await params;
  const id = resolveArtistId(slug);

  const [discography, allFullAlbums, allSingles] = await Promise.all([
    getArtistWithViews(id),
    getArtistFullAlbums(id),
    getArtistSingles(id),
  ]);

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

  const pageData = mapArtistDiscographyToPageData(
    discography,
    allFullAlbums,
    allSingles,
  );

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
