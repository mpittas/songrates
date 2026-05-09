import { Suspense } from "react";

import ApplePlaylistDetailClient from "@/components/apple-playlist/ApplePlaylistDetailClient";
import { getPlaylistDetail } from "@/lib/appleMusic/api";
import Link from "next/link";
import { FaArrowLeft, FaListUl } from "react-icons/fa";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ApplePlaylistPage({ params }: PageProps) {
  const { id } = await params;

  const playlist = await getPlaylistDetail(id);

  if (!playlist) {
    return (
      <main className="min-h-screen">
        <div className="mx-auto w-full max-w-[1180px] px-4 py-20 sm:px-6">
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

  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-[#f0e5df]/30">
          <div className="mx-auto max-w-[1180px] px-4 py-24 sm:px-6">
            <div className="h-8 w-48 animate-pulse rounded bg-neutral-200" />
          </div>
        </main>
      }
    >
      <ApplePlaylistDetailClient playlist={playlist} />
    </Suspense>
  );
}
