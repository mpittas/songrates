import { RATING_COLORS } from "@/components/rating/constants";
import Cover from "@/components/hero-banners/Cover";
import HeroSearch from "@/components/hero-banners/HeroSearch";
import type { HeroTrack } from "@/components/hero-banners/types";

type HeroRatingStackProps = {
  tracks: HeroTrack[];
};

export default function HeroRatingStack({ tracks }: HeroRatingStackProps) {
  const featured = tracks[0];
  const behind = tracks.slice(1, 3);

  return (
    <section
      id="listening-stack"
      className="hero-stack min-h-svh overflow-x-hidden bg-[#10211c] text-[#f3ede4] scroll-mt-14"
    >
      <div className="mx-auto grid min-h-svh w-full max-w-[1180px] items-center gap-12 px-4 py-20 sm:px-6 lg:grid-cols-2 lg:gap-8">
        <div className="max-w-xl">
          <h1 className="font-(family-name:--font-barlow) text-[clamp(2.6rem,7vw,6rem)] leading-[0.88] font-extrabold tracking-[-0.03em] uppercase">
            Hear every take
          </h1>
          <p className="mt-6 max-w-md text-base leading-relaxed text-[#f3ede4]/75 sm:text-lg">
            A 1–10 for the song in front of you. Same scale, every track, no
            stars in the way.
          </p>
          <HeroSearch variant="stack" className="mt-8 max-w-lg" />
        </div>

        <div className="relative mx-auto h-[420px] w-full max-w-[380px] sm:h-[480px]">
          {behind[1] ? (
            <article className="absolute top-4 right-0 w-[78%] rotate-6 opacity-70">
              <StackCard track={behind[1]} compact />
            </article>
          ) : null}
          {behind[0] ? (
            <article className="absolute top-10 left-0 w-[82%] -rotate-6 opacity-85">
              <StackCard track={behind[0]} compact />
            </article>
          ) : null}
          {featured ? (
            <article className="absolute inset-x-6 bottom-0 z-10 rotate-1 sm:inset-x-10">
              <StackCard track={featured} />
            </article>
          ) : null}
        </div>
      </div>
    </section>
  );
}

function StackCard({
  track,
  compact = false,
}: {
  track: HeroTrack;
  compact?: boolean;
}) {
  return (
    <div className="overflow-hidden rounded-sm border border-[#f3ede4]/10 bg-[#173028] shadow-[0_24px_50px_rgba(0,0,0,0.45)]">
      <Cover
        url={track.artworkUrl}
        alt={`${track.name} by ${track.artistName}`}
        sizes="320px"
        className="aspect-square"
      />
      <div className={compact ? "hidden" : "p-4"}>
        <p className="truncate font-(family-name:--font-barlow) text-xl font-bold tracking-wide uppercase">
          {track.name}
        </p>
        <p className="mt-1 truncate text-sm text-[#f3ede4]/60">
          {track.artistName}
        </p>
        <div className="mt-4 flex justify-between" aria-hidden>
          {RATING_COLORS.map((color, index) => (
            <span
              key={color}
              className="flex size-6 items-center justify-center rounded-full text-[10px] font-bold text-black"
              style={{ backgroundColor: color }}
            >
              {index + 1}
            </span>
          ))}
        </div>
        <p className="mt-3 text-xs tracking-wide text-[#f3ede4]/45 uppercase">
          Pick a score after you search
        </p>
      </div>
    </div>
  );
}
