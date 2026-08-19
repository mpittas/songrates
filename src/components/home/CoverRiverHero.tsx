import { Anton } from "next/font/google";
import type { ReactNode } from "react";

import Cover from "@/components/hero-banners/Cover";
import type { HeroTrack } from "@/components/hero-banners/types";
import InstantLink from "@/components/ui/InstantLink";
import { cn, createSlug } from "@/lib/utils";

const anton = Anton({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-anton",
});

type CoverRiverHeroProps = {
  tracks: HeroTrack[];
  search: ReactNode;
  id?: string;
  /** Sit under the site header at content height, not a full viewport. */
  underHeader?: boolean;
};

export default function CoverRiverHero({
  tracks,
  search,
  id,
  underHeader = false,
}: CoverRiverHeroProps) {
  return (
    <section
      id={id}
      className={cn(
        anton.variable,
        "hero-river relative flex flex-col bg-[#0a0a0a]",
        underHeader ? undefined : "min-h-svh scroll-mt-14",
      )}
    >
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,#2c2624_0%,#161312_48%,#070707_100%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_20%,rgba(255,255,255,0.07)_0%,transparent_52%)]" />

      <div
        className={cn(
          "relative z-20 flex flex-col items-center px-4 text-center",
          underHeader
            ? "pt-8 pb-6 sm:pt-10 sm:pb-8"
            : "flex-1 justify-center py-16",
        )}
      >
        <div className="w-full max-w-2xl">
          <h1
            className={cn(
              "font-(family-name:--font-anton) leading-[0.9] font-normal tracking-[-0.02em] text-white uppercase",
              underHeader
                ? "text-[clamp(2.1rem,5.5vw,3.75rem)]"
                : "text-[clamp(2.6rem,8vw,6rem)]",
            )}
          >
            What are you rating?
          </h1>
          <p
            className={cn(
              "mx-auto max-w-md text-white/65",
              underHeader ? "mt-3 text-sm sm:text-base" : "mt-5 text-base",
            )}
          >
            The catalog keeps moving. Stop it on a song, then score it.
          </p>
          <div
            className={cn(
              "relative z-20 mx-auto w-full max-w-[640px] text-left",
              underHeader ? "mt-5" : "mt-8",
            )}
          >
            {search}
          </div>
        </div>
      </div>

      <MarqueeRow tracks={tracks} compact={underHeader} />
    </section>
  );
}

function MarqueeRow({
  tracks,
  compact,
}: {
  tracks: HeroTrack[];
  compact: boolean;
}) {
  const items = uniqueAlbums(tracks);
  if (items.length === 0) return null;

  return (
    <div
      className={cn(
        "relative z-10 overflow-hidden",
        compact ? "pb-5" : "pb-8",
      )}
    >
      <div className="hero-marquee-left flex w-max">
        <CoverSequence tracks={items} compact={compact} />
        <CoverSequence tracks={items} compact={compact} decorative />
      </div>
    </div>
  );
}

function CoverSequence({
  tracks,
  compact,
  decorative = false,
}: {
  tracks: HeroTrack[];
  compact: boolean;
  decorative?: boolean;
}) {
  return (
    <ul
      className="flex"
      aria-hidden={decorative ? true : undefined}
      inert={decorative ? true : undefined}
    >
      {tracks.map((track) => {
        const albumId = track.albumId;
        if (!albumId) return null;

        const title = track.albumName || track.name;
        const href = `/album/${createSlug(title, albumId)}`;

        return (
          <li key={albumId} className="shrink-0 px-1.5">
            <InstantLink
              href={href}
              className={cn(
                "relative block cursor-pointer overflow-hidden bg-neutral-800 transition-opacity hover:opacity-80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white",
                compact ? "size-24 sm:size-28" : "size-28 sm:size-36",
              )}
              tabIndex={decorative ? -1 : undefined}
            >
              <Cover
                url={track.artworkUrl}
                alt={`${title} by ${track.artistName}`}
                sizes={compact ? "112px" : "144px"}
                className="h-full w-full"
              />
            </InstantLink>
          </li>
        );
      })}
    </ul>
  );
}

/** One cover per album. The marquee clones this set once for a seamless loop. */
function uniqueAlbums(tracks: HeroTrack[]): HeroTrack[] {
  const seen = new Set<string>();
  const unique: HeroTrack[] = [];

  for (const track of tracks) {
    if (!track.albumId || !track.artworkUrl) continue;
    if (seen.has(track.albumId)) continue;
    seen.add(track.albumId);
    unique.push(track);
  }

  return unique;
}
