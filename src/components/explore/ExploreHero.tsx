import MySection from "@/components/ui/MySection";

export default function ExploreHero() {
  return (
    <section className="px-2 pt-2">
      <div className="relative overflow-hidden rounded-2xl">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,#3d3834_0%,#2a2724_38%,#1a1816_100%)]" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(237,78,57,0.12)_0%,transparent_45%)]" />
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.06)_0%,transparent_40%)]" />
        <div className="explore-hero-noise pointer-events-none absolute inset-0 opacity-[0.18] mix-blend-overlay" />

        <MySection className="relative z-10 py-12 sm:py-14">
          <div className="mx-auto flex max-w-xl flex-col items-center text-center">
            <h1 className="text-4xl font-medium tracking-tight text-white sm:text-5xl">
              Explore Music
            </h1>
            <p className="mt-3 text-sm text-white/60 sm:text-base">
              Charts, playlists, and genres.
            </p>
          </div>
        </MySection>
      </div>
    </section>
  );
}
