import MySection from "@/components/ui/MySection";
import {
  CardGridSkeleton,
  SectionHeaderSkeleton,
  TrackListSkeleton,
} from "@/components/ui/Skeleton";

export function HomeHeroSkeleton() {
  return (
    <section className="px-2 pt-2 sm:px-3 sm:pt-3">
      <div className="relative overflow-hidden rounded-[28px] bg-[#0c0b0a] sm:rounded-[32px]">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_80%_at_50%_0%,#2a2320_0%,#141110_45%,#0a0909_100%)]" />
        <div className="relative flex flex-col items-center px-5 pt-14 pb-10 sm:pt-20 sm:pb-12">
          <div className="h-7 w-52 rounded-full bg-white/[0.06]" />
          <div className="mt-6 h-12 w-[min(36rem,85%)] rounded-xl bg-white/[0.08] sm:h-16 lg:h-20" />
          <div className="mt-5 h-4 w-72 max-w-[80%] rounded bg-white/[0.06]" />
          <div className="mt-8 h-14 w-full max-w-[600px] rounded-2xl bg-white/[0.08] sm:h-16" />
        </div>
        <div className="relative flex gap-3 overflow-hidden px-2 pb-6 sm:gap-4 sm:pb-8">
          {Array.from({ length: 12 }).map((_, index) => (
            <div
              key={index}
              className="size-24 shrink-0 rounded-xl bg-white/[0.05] sm:size-32"
            />
          ))}
        </div>
      </div>
    </section>
  );
}

export function HomeTrendingSkeleton() {
  return (
    <MySection className="pt-12 pb-10 sm:pt-16 sm:pb-14">
      <SectionHeaderSkeleton />
      <TrackListSkeleton rows={10} columns={2} />
    </MySection>
  );
}

export function HomeGridSkeleton({ columns }: { columns: 4 | 6 }) {
  return (
    <MySection className="py-10 sm:py-14">
      <SectionHeaderSkeleton />
      <CardGridSkeleton count={columns} columns={columns} />
    </MySection>
  );
}

export default function HomePageSkeleton() {
  return (
    <main className="relative flex min-h-screen flex-col pb-10 text-ink">
      <HomeHeroSkeleton />
      <HomeTrendingSkeleton />
      <HomeGridSkeleton columns={6} />
    </main>
  );
}
