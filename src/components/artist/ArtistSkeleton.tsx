import MySection from "@/components/ui/MySection";
import { cn } from "@/lib/utils";
import { PAGE_CONTENT_TOP } from "@/lib/pageLayout";

function ShimmerBar({ className }: { className?: string }) {
  return (
    <div className={cn("rounded-md bg-neutral-300/80", className)} />
  );
}

function AccordionHeaderSkeleton() {
  return (
    <div className="flex h-8 w-full items-center justify-between gap-4 rounded-md border border-neutral-200/80 bg-white px-3 shadow-[0_1px_0_rgba(0,0,0,0.04)]">
      <div className="flex min-w-0 flex-1 items-center gap-2">
        <ShimmerBar className="h-3.5 w-3.5 shrink-0 rounded-sm" />
        <ShimmerBar className="h-3 w-28 max-w-[45%]" />
        <ShimmerBar className="h-3 w-8 shrink-0" />
      </div>
      <ShimmerBar className="h-2.5 w-2.5 shrink-0 rounded-sm" />
    </div>
  );
}

function SongRowSkeleton({ showSubline }: { showSubline?: boolean }) {
  return (
    <div className="flex items-center gap-3 border-b border-neutral-200/70 py-3 pr-2">
      <ShimmerBar className="h-3 w-4 shrink-0" />
      <ShimmerBar className="h-6 w-6 shrink-0 rounded border border-neutral-200/80" />
      <div className="min-w-0 flex-1 space-y-1.5">
        <ShimmerBar className="h-3.5 w-[min(100%,14rem)]" />
        {showSubline ? <ShimmerBar className="h-2.5 w-24" /> : null}
      </div>
      <ShimmerBar className="hidden h-3 w-16 shrink-0 sm:block" />
    </div>
  );
}

function AlbumCardSkeleton() {
  return (
    <div className="space-y-2">
      <div className="aspect-square w-full rounded-md border border-neutral-200/80 bg-neutral-200/50" />
      <ShimmerBar className="h-3 w-4/5 max-w-full" />
      <ShimmerBar className="h-2.5 w-1/2 max-w-full" />
    </div>
  );
}

export default function ArtistSkeleton() {
  return (
    <main className="min-h-screen text-neutral-900">
      <MySection className={cn(PAGE_CONTENT_TOP, "pb-28 md:pb-32")}>
        <div className="pointer-events-none absolute left-0 top-0 z-0 h-[500px] w-full bg-linear-to-b from-[#f0e5df] to-[#f0e5df]/0" />

        <div className="animate-pulse">
          {/* Matches ArtistPageHeader */}
          <div className="relative z-10 mb-8 flex flex-wrap items-center justify-between gap-3">
            <ShimmerBar className="h-8 w-[9.5rem]" />
            <div className="flex flex-wrap items-center justify-end gap-3">
              <ShimmerBar className="h-8 w-[6.5rem]" />
              <ShimmerBar className="h-8 w-[8.75rem]" />
            </div>
          </div>

          {/* Matches ArtistInfo + Discography grid */}
          <div className="relative z-10 grid grid-cols-1 items-start gap-8 lg:grid-cols-[220px_1fr] lg:gap-20">
            <div className="flex flex-col items-center gap-3 pt-6 lg:sticky lg:top-20">
              <div className="aspect-square w-[140px] shrink-0 rounded-full border border-neutral-200/60 bg-neutral-200/50" />
              <ShimmerBar className="mt-3 h-7 w-40" />
              <div className="flex flex-wrap justify-center gap-1">
                <ShimmerBar className="h-6 w-14 rounded-full" />
                <ShimmerBar className="h-6 w-20 rounded-full" />
                <ShimmerBar className="h-6 w-16 rounded-full" />
              </div>
            </div>

            <div className="min-w-0 space-y-4">
              {/* Top Songs */}
              <div>
                <AccordionHeaderSkeleton />
                <div className="pt-2">
                  <SongRowSkeleton />
                  <SongRowSkeleton showSubline />
                  <SongRowSkeleton />
                  <SongRowSkeleton showSubline />
                  <SongRowSkeleton />
                </div>
              </div>

              {/* Essential — 3-up grid */}
              <div>
                <AccordionHeaderSkeleton />
                <div className="grid grid-cols-2 gap-3 pt-2 sm:grid-cols-3">
                  <AlbumCardSkeleton />
                  <AlbumCardSkeleton />
                  <AlbumCardSkeleton />
                </div>
              </div>

              {/* Albums — denser grid */}
              <div>
                <AccordionHeaderSkeleton />
                <div className="grid grid-cols-2 gap-3 pt-2 sm:grid-cols-3">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <AlbumCardSkeleton key={i} />
                  ))}
                </div>
              </div>

              {/* EPs & Singles + Appears On — collapsed-looking sections (header only) */}
              <div>
                <AccordionHeaderSkeleton />
                <div className="grid grid-cols-2 gap-3 pt-2 sm:grid-cols-3">
                  <AlbumCardSkeleton />
                  <AlbumCardSkeleton />
                  <AlbumCardSkeleton />
                </div>
              </div>

              <div>
                <AccordionHeaderSkeleton />
                <div className="grid grid-cols-2 gap-3 pt-2 sm:grid-cols-3">
                  <AlbumCardSkeleton />
                  <AlbumCardSkeleton />
                  <AlbumCardSkeleton />
                </div>
              </div>
            </div>
          </div>
        </div>
      </MySection>
    </main>
  );
}
