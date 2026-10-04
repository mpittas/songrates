import { LuArrowRight } from "react-icons/lu";

import InstantLink from "@/components/ui/InstantLink";
import OptimizedImage from "@/components/ui/OptimizedImage";
import { artworkUrl, type ApplePlaylistResult } from "@/lib/appleMusic/api";

/**
 * Editorial spotlight. Shows the full square artwork on a blurred wash of
 * itself, so playlist covers are never cropped.
 */
export default function FeaturedPlaylistCard({
  playlist,
  priority = false,
}: {
  playlist: ApplePlaylistResult;
  priority?: boolean;
}) {
  const art = artworkUrl(playlist.artworkUrl, 600);

  return (
    <InstantLink
      href={`/apple-playlist/${playlist.id}`}
      className="group relative isolate flex h-full items-center gap-5 overflow-hidden rounded-2xl bg-[#141312] p-4 text-white outline-offset-4 sm:gap-6 sm:p-5"
    >
      <div aria-hidden className="absolute inset-0 -z-10">
        <OptimizedImage
          src={art}
          alt=""
          fill
          className="scale-150 object-cover opacity-60 blur-3xl saturate-150"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/30 via-black/45 to-black/60" />
      </div>

      <div className="relative aspect-square w-28 shrink-0 overflow-hidden rounded-xl shadow-[0_18px_40px_-12px_rgb(0_0_0/0.6)] ring-1 ring-white/10 transition-transform duration-500 ease-out group-hover:scale-[1.03] sm:w-40 lg:w-44">
        <OptimizedImage
          src={art}
          alt={playlist.name}
          fill
          priority={priority}
          className="object-cover"
          fallbackSrc="/vinyl-placeholder.svg"
        />
      </div>

      <div className="min-w-0 flex-1">
        <p className="eyebrow text-white/60">Featured playlist</p>
        <h3 className="mt-2 font-display text-xl leading-tight font-semibold tracking-[-0.03em] text-balance sm:text-2xl lg:text-[1.75rem]">
          {playlist.name}
        </h3>
        <p className="mt-1 text-sm text-white/70">
          {playlist.curatorName || "Apple Music"}
        </p>
        {playlist.description ? (
          <p className="mt-3 hidden text-[13px] leading-5 text-white/60 sm:line-clamp-2">
            {playlist.description}
          </p>
        ) : null}
        <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-white/90 transition-colors group-hover:text-white">
          Open playlist
          <LuArrowRight
            size={15}
            className="transition-transform duration-200 group-hover:translate-x-0.5"
          />
        </span>
      </div>
    </InstantLink>
  );
}
