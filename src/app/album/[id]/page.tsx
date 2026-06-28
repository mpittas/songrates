import AlbumPageContent from "@/components/album/AlbumPageContent";
import { getAlbumInfo } from "@/lib/appleMusic/albumInfo";
import { resolveAlbumId } from "@/lib/resolveAlbumId";

/** ISR: regenerate album pages at most once every 6 hours.
 *  Album metadata is public and slow-moving, so server rendering avoids an
 *  extra /api/album-info function invocation on every album page visit. */
export const revalidate = 21600;

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{
    userId?: string;
    track?: string;
    userName?: string;
  }>;
}

export default async function AlbumPage({ params, searchParams }: PageProps) {
  const [{ id: slug }, query] = await Promise.all([params, searchParams]);
  const albumId = resolveAlbumId(slug);
  const album = await getAlbumInfo(slug);

  return (
    <AlbumPageContent
      slug={slug}
      albumId={albumId}
      viewingUserId={query.userId ?? null}
      highlightTrackId={query.track ?? null}
      fallbackUserName={query.userName ?? null}
      initialAlbum={album}
    />
  );
}
