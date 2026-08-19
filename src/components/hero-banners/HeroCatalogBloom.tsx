import Cover from "@/components/hero-banners/Cover";
import HeroSearch from "@/components/hero-banners/HeroSearch";
import type { HeroTrack } from "@/components/hero-banners/types";

type HeroCatalogBloomProps = {
  tracks: HeroTrack[];
};

export default function HeroCatalogBloom({ tracks }: HeroCatalogBloomProps) {
  const tiles =
    tracks.length > 0
      ? Array.from({ length: 36 }, (_, index) => tracks[index % tracks.length])
      : [];

  return (
    <section
      id="catalog-bloom"
      className="hero-bloom relative min-h-svh overflow-hidden bg-[#faf8f5] scroll-mt-14"
    >
      <div
        className="pointer-events-none absolute inset-0 grid grid-cols-6 sm:grid-cols-8 lg:grid-cols-12"
        aria-hidden
      >
        {tiles.map((track, index) => (
          <Cover
            key={`${track.id}-${index}`}
            url={track.artworkUrl}
            alt=""
            sizes="10vw"
            className="aspect-square"
          />
        ))}
      </div>

      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(250,248,245,0.96)_0%,rgba(250,248,245,0.78)_28%,rgba(250,248,245,0.18)_58%,transparent_72%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_bottom,#faf8f5_0%,transparent_18%,transparent_82%,#faf8f5_100%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,#faf8f5_0%,transparent_14%,transparent_86%,#faf8f5_100%)]" />

      <div className="relative z-10 mx-auto flex min-h-svh w-full max-w-3xl flex-col items-center justify-center px-4 py-24 text-center">
        <h1 className="font-(family-name:--font-red-hat) text-[clamp(2.4rem,6vw,6rem)] leading-[0.92] font-black tracking-[-0.035em] text-[#8f1d28]">
          Rate the whole catalog
        </h1>
        <p className="mt-5 max-w-md text-base text-neutral-700 sm:text-lg">
          Search any song and leave a 1–10. The covers behind you are this
          week&apos;s global chart.
        </p>
        <HeroSearch variant="bloom" className="mt-8 max-w-xl" />
      </div>
    </section>
  );
}
