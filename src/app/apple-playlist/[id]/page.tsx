import ApplePlaylistDetailClient from "@/components/apple-playlist/ApplePlaylistDetailClient";
import { getPlaylistDetail } from "@/lib/appleMusic/api";
import { PAGE_CONTENT_TOP } from "@/lib/pageLayout";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { FaArrowLeft, FaListUl } from "react-icons/fa";

/** ISR: regenerate playlist pages at most once per hour */
export const revalidate = 3600;

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ApplePlaylistPage({ params }: PageProps) {
  const { id } = await params;

  const playlist = await getPlaylistDetail(id);

  if (!playlist) {
    return (
      <main className="min-h-screen">
        <div
          className={cn(
            "mx-auto w-full max-w-[1180px] px-4 sm:px-6 pb-20",
            PAGE_CONTENT_TOP,
          )}
        >
          <Link
            href="/"
            className="mb-8 inline-flex items-center gap-2 font-mono text-sm text-neutral-500 transition-colors hover:text-neutral-900"
          >
            <FaArrowLeft size={12} />
            Back to Home
          </Link>
          <div className="py-16 text-center">
            <FaListUl size={32} className="mx-auto mb-4 text-neutral-700" />
            <p className="font-mono text-sm text-neutral-500">
              Playlist not found
            </p>
          </div>
        </div>
      </main>
    );
  }

  return <ApplePlaylistDetailClient playlist={playlist} />;
}
