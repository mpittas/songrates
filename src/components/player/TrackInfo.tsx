"use client";

import InstantLink from "@/components/ui/InstantLink";
import OptimizedImage from "@/components/ui/OptimizedImage";
import { TrackInfoProps } from "@/types/player";

export default function TrackInfo({ currentTrack }: TrackInfoProps) {
  if (!currentTrack) return null;

  const albumHref = currentTrack.albumId
    ? `/album/${currentTrack.albumId}`
    : undefined;
  const artistHref = currentTrack.artistId
    ? `/artist/${currentTrack.artistId}`
    : undefined;

  return (
    <div className="flex min-w-0 items-center gap-3">
      <InstantLink
        href={albumHref || "#"}
        className="relative size-11 shrink-0 overflow-hidden rounded-lg bg-white/5 ring-1 ring-white/10 transition-transform duration-200 hover:scale-[1.03] md:size-14"
        aria-label={currentTrack.title}
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

      <div className="min-w-0">
        <InstantLink
          href={albumHref || "#"}
          className="block truncate text-[13px] font-medium tracking-tight text-white transition-colors hover:underline md:text-sm"
        >
          {currentTrack.title}
        </InstantLink>
        <InstantLink
          href={artistHref || "#"}
          className="mt-0.5 block truncate text-[11px] text-white/50 transition-colors hover:text-white/80 md:text-xs"
        >
          {currentTrack.artistName}
        </InstantLink>
      </div>
    </div>
  );
}
