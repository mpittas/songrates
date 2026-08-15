import Link from "next/link";

import OptimizedImage from "@/components/ui/OptimizedImage";
import { artworkUrl, type ApplePlaylistResult } from "@/lib/appleMusic/api";

export default function FeaturedPlaylistCard({
  playlist,
}: {
  playlist: ApplePlaylistResult;
}) {
  return (
    <Link
      href={`/apple-playlist/${playlist.id}`}
      prefetch={false}
      className="group relative block overflow-hidden rounded-2xl bg-neutral-900"
    >
      <div className="relative aspect-[16/9]">
        <OptimizedImage
          src={artworkUrl(playlist.artworkUrl, 800)}
          alt={playlist.name}
          fill
          priority
          className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03]"
          fallbackSrc="/vinyl-placeholder.svg"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-transparent" />
      </div>

      <div className="absolute inset-x-0 bottom-0 p-5 sm:p-6">
        <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-white/55">
          {playlist.curatorName || "Apple Music"}
        </p>
        <h3 className="mt-1 text-xl font-medium tracking-tight text-white sm:text-2xl">
          {playlist.name}
        </h3>
      </div>
    </Link>
  );
}
