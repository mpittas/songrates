import ApplePlaylistDetailClient from "@/components/apple-playlist/ApplePlaylistDetailClient";
import Button from "@/components/ui/Button";
import EmptyState from "@/components/ui/EmptyState";
import { getPlaylistDetail } from "@/lib/appleMusic/api";
import { PAGE_CONTAINER } from "@/lib/pageLayout";
import { cn } from "@/lib/utils";
import { LuListMusic } from "react-icons/lu";

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
      <main className={cn(PAGE_CONTAINER, "min-h-[60vh] py-16")}>
        <EmptyState
          icon={<LuListMusic size={22} />}
          title="Playlist not found"
          description="This playlist is missing or no longer available on Apple Music."
          action={
            <Button href="/explore" variant="primary" size="md">
              Explore playlists
            </Button>
          }
        />
      </main>
    );
  }

  return <ApplePlaylistDetailClient playlist={playlist} />;
}
