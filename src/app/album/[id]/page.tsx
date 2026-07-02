import AlbumPageContent from "@/components/album/AlbumPageContent";
import { getAlbumInfo } from "@/lib/appleMusic/albumInfo";
import { resolveAlbumId } from "@/lib/resolveAlbumId";
import type { Metadata } from "next";

/** ISR: regenerate album pages at most once every 6 hours.
 *  Album metadata is public and slow-moving, so server rendering avoids an
 *  extra /api/album-info function invocation on every album page visit.
 *
 *  Returning [] from generateStaticParams registers this dynamic route as an
 *  ISR route on Vercel (no paths prebuilt at build time, but on-demand
 *  generation is cached and revalidated). Without this, `revalidate` is a
 *  no-op and every request is treated as fully dynamic (0% cache hit).
 *
 *  We intentionally do NOT read `searchParams` here: doing so would opt the
 *  route out of caching and bust the cache for every unique query string
 *  (e.g. share links like ?userId=…&track=…). The client reads those instead.
 *  This keeps the cache key solely the album path, so all requests to a given
 *  album — share links included — hit the same cached HTML. */
export const revalidate = 21600;
export const dynamicParams = true;

export async function generateStaticParams() {
  return [];
}

interface PageProps {
  params: Promise<{ id: string }>;
}

/** noindex: album pages are pure product data mirrors of Apple Music and have
 *  no SEO value for us. Keeping them out of the index removes the incentive
 *  for crawlers to enumerate millions of album IDs (which is what drives the
 *  Vercel bill). Human visitors and share links still work fine. */
export const generateMetadata = async ({
  params,
}: PageProps): Promise<Metadata> => {
  const { id } = await params;
  return {
    title: "songrates",
    robots: { index: false, follow: false },
    alternates: {
      canonical: `/album/${id}`,
    },
  };
};

export default async function AlbumPage({ params }: PageProps) {
  const { id: slug } = await params;
  const albumId = resolveAlbumId(slug);
  const album = await getAlbumInfo(slug);

  return (
    <AlbumPageContent
      slug={slug}
      albumId={albumId}
      initialAlbum={album}
    />
  );
}
