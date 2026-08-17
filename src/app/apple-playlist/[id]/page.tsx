import ApplePlaylistDetailClient from "@/components/apple-playlist/ApplePlaylistDetailClient";
import CollectionDetailPageLayout from "@/components/layout/CollectionDetailPageLayout";
import Button from "@/components/ui/Button";
import { getPlaylistDetail } from "@/lib/appleMusic/api";
import { FaArrowLeft } from "react-icons/fa";

/** ISR: regenerate playlist pages at most once every 6 hours.
 *  Apple editorial/chart playlists are slow-moving and expensive to rebuild.
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

export default async function ApplePlaylistPage({ params }: PageProps) {
  const { id } = await params;

  const playlist = await getPlaylistDetail(id);

  if (!playlist) {
    return (
      <CollectionDetailPageLayout
        topBarLeft={
          <Button
            href="/genres"
            variant="secondary"
            size="xs"
            iconLeft={<FaArrowLeft size={14} className="mr-2" />}
          >
            BACK TO PLAYLISTS
          </Button>
        }
        artworkSrc="/vinyl-placeholder.svg"
        artworkAlt="Playlist not found"
        title="Playlist not found"
        subtitle={
          <p className="mb-4 text-md text-neutral-600">
            This playlist is missing or unavailable.
          </p>
        }
        list={
          <p className="py-16 text-center text-sm text-neutral-500">
            Try another playlist from genres or explore.
          </p>
        }
      />
    );
  }

  return <ApplePlaylistDetailClient playlist={playlist} />;
}
