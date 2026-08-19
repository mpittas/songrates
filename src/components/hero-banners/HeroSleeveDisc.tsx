import Cover from "@/components/hero-banners/Cover";
import HeroSearch from "@/components/hero-banners/HeroSearch";
import type { HeroTrack } from "@/components/hero-banners/types";

type HeroSleeveDiscProps = {
  track: HeroTrack | undefined;
};

export default function HeroSleeveDisc({ track }: HeroSleeveDiscProps) {
  const title = (track?.albumName || track?.name || "This week’s most-played").replace(
    /\s[-–]\s+(Single|EP)$/i,
    "",
  );
  const artist = track?.artistName || "Search to find it";

  return (
    <section
      id="sleeve-disc"
      className="hero-sleeve min-h-svh overflow-x-hidden bg-[#f4f4f2] scroll-mt-14"
    >
      <div className="mx-auto grid min-h-svh w-full max-w-[1180px] items-center gap-12 px-4 py-20 sm:px-6 lg:grid-cols-[1.15fr_0.85fr] lg:gap-16">
        <div className="relative mx-auto w-full max-w-[460px]">
          <div
            className="hero-vinyl-grooves absolute top-1/2 -right-[16%] h-[84%] w-[84%] -translate-y-1/2 rounded-full shadow-[0_28px_50px_rgba(0,0,0,0.28)]"
            aria-hidden
          />
          <Cover
            url={track?.artworkUrl ?? ""}
            alt={track ? `${title} by ${artist}` : "Album sleeve"}
            sizes="(max-width: 1024px) 80vw, 420px"
            className="z-10 aspect-square rounded-xs shadow-[0_30px_60px_rgba(0,0,0,0.22)]"
          />
        </div>

        <div className="max-w-md lg:justify-self-start">
          <h1 className="font-(family-name:--font-bricolage) text-[clamp(2.2rem,4.4vw,4.4rem)] leading-[1.02] font-extrabold tracking-[-0.03em] text-neutral-950">
            {title}
          </h1>
          <p className="mt-4 text-lg text-neutral-600">{artist}</p>
          <p className="mt-6 max-w-sm text-base leading-relaxed text-neutral-700">
            Treat every record like the one on the counter. Search it, score it,
            keep moving.
          </p>
          <HeroSearch variant="sleeve" className="mt-8" />
        </div>
      </div>
    </section>
  );
}
