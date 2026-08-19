"use client";

import InstantLink from "@/components/ui/InstantLink";
import OptimizedImage from "@/components/ui/OptimizedImage";
import { playbackSourceKindLabel } from "@/lib/playbackSource";
import { TrackInfoProps } from "@/types/player";

export default function TrackInfo({
  currentTrack,
  playbackSource,
}: TrackInfoProps) {
  if (!currentTrack) return null;

  const albumHref = currentTrack.albumId
    ? `/album/${currentTrack.albumId}`
    : undefined;
  const artistHref = currentTrack.artistId
    ? `/artist/${currentTrack.artistId}`
    : undefined;
  const sourceHref = playbackSource?.href;
  const coverHref = sourceHref || albumHref;
  const sourceKind = playbackSource
    ? playbackSourceKindLabel(playbackSource)
    : undefined;

  return (
    <div className="flex min-w-0 items-center gap-3">
      <InstantLink
        href={coverHref || "#"}
        className="relative size-11 shrink-0 overflow-hidden rounded-lg bg-white/5 ring-1 ring-white/10 transition-transform duration-200 hover:scale-[1.03] md:size-14"
        aria-label={
          playbackSource
            ? `Open ${sourceKind} ${playbackSource.title}`
            : currentTrack.title
        }
      >
        <OptimizedImage
          src={currentTrack.albumImageUrl || "/vinyl-placeholder.svg"}
          alt={currentTrack.artistName || "Unknown Artist"}
          width={56}
          height={56}
          priority
          className="size-full object-cover"
          fallbackSrc="/vinyl-placeholder.svg"
          fallbackText={currentTrack.title?.slice(0, 2) || "??"}
        />
      </InstantLink>

      <div className="min-w-0 leading-tight">
        <InstantLink
          href={albumHref || "#"}
          className="block truncate text-[13px] font-medium tracking-tight text-white transition-colors hover:underline md:text-sm"
        >
          {currentTrack.title}
        </InstantLink>
        <div className="mt-0.5 flex min-w-0 items-center gap-1 text-[11px] md:text-xs">
          <InstantLink
            href={artistHref || "#"}
            className="min-w-0 truncate text-white/50 transition-colors hover:text-white/80"
          >
            {currentTrack.artistName}
          </InstantLink>
          {playbackSource ? (
            <>
              <span className="shrink-0 text-white/20">·</span>
              <InstantLink
                href={playbackSource.href}
                className="min-w-0 truncate text-white/40 transition-colors hover:text-white/75 hover:underline"
                title={`Open ${sourceKind} ${playbackSource.title}`}
              >
                {sourceKind} · {playbackSource.title}
              </InstantLink>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}
