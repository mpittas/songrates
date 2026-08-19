import Cover from "@/components/hero-banners/Cover";
import HeroSearch from "@/components/hero-banners/HeroSearch";
import type { HeroTrack } from "@/components/hero-banners/types";

type HeroCutDivideProps = {
  track: HeroTrack | undefined;
};

export default function HeroCutDivide({ track }: HeroCutDivideProps) {
  return (
    <section
      id="cut-divide"
      className="hero-cut grid min-h-svh bg-[#0a0a0a] md:grid-cols-2 scroll-mt-14"
    >
      <div className="hero-cut-image relative min-h-[42svh] md:min-h-svh">
        <div className="absolute inset-0">
          <Cover
            url={track?.artworkUrl ?? ""}
            alt={
              track
                ? `${track.albumName || track.name} by ${track.artistName}`
                : "Featured artwork"
            }
            sizes="(max-width: 768px) 100vw, 55vw"
            className="h-full w-full"
          />
        </div>
        <div className="pointer-events-none absolute inset-0 bg-linear-to-r from-transparent to-black/25 max-md:bg-linear-to-t max-md:from-black/40 max-md:to-transparent" />
      </div>

      <div className="flex items-center px-6 py-16 sm:px-12 lg:px-16">
        <div className="max-w-md">
          <h1 className="font-(family-name:--font-shoulders) text-[clamp(3rem,8vw,6rem)] leading-[0.84] font-extrabold tracking-[-0.03em] text-white uppercase">
            Find it.
            <span className="block text-[#ff6a3d]">Rate it.</span>
          </h1>
          <p className="mt-6 text-base leading-relaxed text-white/70">
            Search the catalog. Drop a score. That is the whole product —
            anywhere you open it.
          </p>
          <HeroSearch variant="cut" className="mt-8" />
        </div>
      </div>
    </section>
  );
}
