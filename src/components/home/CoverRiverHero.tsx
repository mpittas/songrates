import type { ReactNode } from "react";

import Cover from "@/components/hero-banners/Cover";
import type { HeroTrack } from "@/components/hero-banners/types";
import InstantLink from "@/components/ui/InstantLink";
import { cn, createSlug } from "@/lib/utils";

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
        "relative px-2 pt-2 sm:px-3 sm:pt-3",
        underHeader ? undefined : "min-h-svh scroll-mt-14",
      )}
    >
      <div className="hero-river relative isolate overflow-hidden rounded-[28px] bg-[#0c0b0a] text-white sm:rounded-[32px]">
        <HeroBackdrop />

        <div
          className={cn(
            "relative z-20 flex flex-col items-center px-5 text-center",
            underHeader ? "pt-14 pb-10 sm:pt-20 sm:pb-12" : "py-24",
          )}
        >
          <p className="eyebrow inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-3 py-1.5 text-white/70 backdrop-blur-md">
            <span className="size-1.5 rounded-full bg-accent shadow-[0_0_12px_2px_rgb(226_83_27/0.7)]" />
            Rate music track by track
          </p>
          <h1 className="mt-6 max-w-3xl font-display text-[2.75rem] leading-[0.95] font-semibold tracking-[-0.055em] text-balance sm:text-6xl lg:text-[5rem]">
            What are you rating?
          </h1>
          <p className="mt-5 max-w-md text-[15px] leading-6 text-white/60 sm:text-base">
            The catalog keeps moving. Stop it on a song, then score it.
          </p>
          <div className="relative z-20 mt-8 w-full max-w-[600px] text-left">
            {search}
          </div>
        </div>

        <MarqueeRow tracks={tracks} />
      </div>
    </section>
  );
}

function HeroBackdrop() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0">
      <div className="absolute inset-0 bg-[radial-gradient(120%_80%_at_50%_0%,#2a2320_0%,#141110_45%,#0a0909_100%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(40%_35%_at_50%_0%,rgb(226_83_27/0.22),transparent_70%)]" />
      <div className="explore-hero-noise absolute inset-0 opacity-[0.07] mix-blend-overlay" />
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/25 to-transparent" />
    </div>
  );
}

function MarqueeRow({ tracks }: { tracks: HeroTrack[] }) {
  const items = uniqueAlbums(tracks);
  if (items.length === 0) return null;

  return (
    <div className="relative z-10 overflow-hidden pb-6 [mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)] sm:pb-8">
      <div className="hero-marquee-left flex w-max">
        <CoverSequence tracks={items} />
        <CoverSequence tracks={items} decorative />
      </div>
    </div>
  );
}

function CoverSequence({
  tracks,
  decorative = false,
}: {
  tracks: HeroTrack[];
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
          <li key={albumId} className="shrink-0 px-1.5 sm:px-2">
            <InstantLink
              href={href}
              className="group relative block size-24 cursor-pointer overflow-hidden rounded-xl bg-white/5 ring-1 ring-white/10 transition-transform duration-300 ease-out hover:-translate-y-1 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white sm:size-32"
              tabIndex={decorative ? -1 : undefined}
              aria-label={`${title} by ${track.artistName}`}
            >
              <Cover
                url={track.artworkUrl}
                alt=""
                sizes="(min-width: 640px) 128px, 96px"
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
