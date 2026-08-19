import InstantLink from "@/components/ui/InstantLink";

import OptimizedImage from "@/components/ui/OptimizedImage";
import { artworkUrl, type ApplePlaylistResult } from "@/lib/appleMusic/api";

export default function FeaturedPlaylistCard({
  playlist,
}: {
  playlist: ApplePlaylistResult;
}) {
  return (
    <InstantLink
      href={`/apple-playlist/${playlist.id}`}
      className="group relative block overflow-hidden rounded-2xl bg-neutral-900"
    >
      <div className="relative aspect-3/2">
        <OptimizedImage
          src={artworkUrl(playlist.artworkUrl, 800)}
          alt={playlist.name}
          fill
          priority
          className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03]"
          fallbackSrc="/vinyl-placeholder.svg"
        />
        <div className="absolute inset-0 bg-linear-to-t from-black/75 via-black/20 to-transparent" />
      </div>

      <div className="absolute inset-x-0 bottom-0 p-5 sm:p-6">
        <h3 className="text-xl font-medium tracking-tight text-white sm:text-2xl">
          {playlist.name}
        </h3>
        <p className="mt-1 text-sm text-white/70">
          {playlist.curatorName || "Apple Music"}
        </p>
      </div>
    </InstantLink>
  );
}
