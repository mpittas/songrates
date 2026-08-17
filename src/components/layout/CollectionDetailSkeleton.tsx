import MySection from "@/components/ui/MySection";
import { cn } from "@/lib/utils";
import { PAGE_CONTAINER, PAGE_CONTENT_TOP } from "@/lib/pageLayout";

function ShimmerBar({ className }: { className?: string }) {
  return <div className={cn("rounded-md bg-neutral-300/80", className)} />;
}

function TrackRowSkeleton({ showSubline }: { showSubline?: boolean }) {
  return (
    <div className="flex flex-col rounded-lg border border-neutral-100 bg-white">
      <div className="flex items-center gap-3 px-3 py-2.5">
        <ShimmerBar className="h-8 w-8 shrink-0 rounded-full" />
        <div className="h-10 w-10 shrink-0 rounded-md bg-neutral-200/70" />
        <div className="min-w-0 flex-1 space-y-1.5">
          <ShimmerBar className="h-3.5 w-[min(100%,12rem)]" />
          {showSubline ? (
            <div className="flex flex-wrap items-center gap-x-1">
              <ShimmerBar className="h-2.5 w-20" />
              <span className="text-[10px] font-mono text-neutral-400/40">
                ft.
              </span>
              <ShimmerBar className="h-2.5 w-24" />
            </div>
          ) : null}
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          <ShimmerBar className="hidden h-3 w-8 sm:block" />
          <ShimmerBar className="h-7 w-7 rounded-full" />
          <ShimmerBar className="h-6 w-6 rounded" />
        </div>
      </div>
    </div>
  );
}

export default function CollectionDetailSkeleton({
  showTopBarRight = false,
  showRatingRow = false,
  showOtherVersions = false,
}: {
  showTopBarRight?: boolean;
  showRatingRow?: boolean;
  showOtherVersions?: boolean;
}) {
  return (
    <main className="min-h-screen text-neutral-900">
      <MySection className="pb-24" container={false}>
        <div className="pointer-events-none absolute left-0 top-0 z-0 h-[500px] w-full bg-linear-to-b from-[#f0e5df] to-[#f0e5df]/0" />

        <div className={cn("relative z-10", PAGE_CONTAINER, PAGE_CONTENT_TOP)}>
          <div className="animate-pulse">
            <div className="mb-12 flex flex-wrap items-center justify-between gap-3">
              <ShimmerBar className="h-8 w-[9.5rem]" />
              {showTopBarRight ? (
                <div className="flex flex-wrap items-center gap-3">
                  <ShimmerBar className="h-8 w-[6.5rem]" />
                  <ShimmerBar className="h-8 w-[6.5rem]" />
                </div>
              ) : null}
            </div>

            <div className="relative mb-8 flex flex-col items-start gap-8 md:flex-row md:gap-12">
              <div className="relative w-full shrink-0 self-start sm:w-52 md:w-72">
                <div className="aspect-square w-full rounded-xl bg-neutral-200/70 ring-1 ring-neutral-200/80" />
              </div>

              <div className="flex w-full min-w-0 flex-1 flex-col items-start justify-center md:pt-4">
                <div className="mb-5 flex items-center gap-2 rounded-full border border-neutral-200/60 bg-white p-3 shadow-[0_1px_0_rgba(0,0,0,0.04)] md:mb-8">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-neutral-200/90" />
                  <ShimmerBar className="h-5 w-28" />
                </div>

                <ShimmerBar className="mb-4 h-9 w-[min(100%,20rem)] md:h-11" />

                <div className="text-md mb-4 flex flex-wrap items-center gap-x-1 text-neutral-600">
                  <ShimmerBar className="h-4 w-24" />
                  <span className="px-1 text-[10px] font-mono text-neutral-400/40">
                    ft.
                  </span>
                  <ShimmerBar className="h-4 w-28" />
                </div>

                <div className="mb-6 flex w-full flex-wrap items-center gap-2 border-t border-neutral-950/10 pt-4">
                  <ShimmerBar className="h-6 w-14 rounded bg-neutral-200/80" />
                  <span className="text-neutral-300">•</span>
                  <ShimmerBar className="h-4 w-10" />
                  <span className="text-neutral-300">•</span>
                  <ShimmerBar className="h-4 w-20" />
                </div>
              </div>
            </div>

            {showRatingRow ? (
              <div className="mb-8 grid w-full grid-cols-1 gap-0 md:grid-cols-2">
                <div className="flex items-center justify-between rounded-l-xl bg-neutral-900 p-4 md:rounded-l-xl md:rounded-r-none">
                  <div className="flex items-center gap-4">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-neutral-800" />
                    <div className="space-y-1.5">
                      <ShimmerBar className="h-2.5 w-20 bg-neutral-600/50" />
                      <ShimmerBar className="h-4 w-32 bg-neutral-500/40" />
                    </div>
                  </div>
                  <div className="ml-4 rounded-lg bg-neutral-950 p-2">
                    <ShimmerBar className="h-8 w-10 bg-neutral-700/50" />
                  </div>
                </div>
                <div className="flex items-center justify-between border-t border-white/10 bg-neutral-900 p-4 md:border-l md:border-t-0 md:rounded-l-none md:rounded-r-xl">
                  <div className="flex items-center gap-4">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-neutral-800" />
                    <div className="space-y-1.5">
                      <ShimmerBar className="h-2.5 w-16 bg-neutral-600/50" />
                      <ShimmerBar className="h-4 w-24 bg-neutral-500/40" />
                    </div>
                  </div>
                  <div className="ml-4 rounded-lg bg-neutral-950 p-2">
                    <ShimmerBar className="h-8 w-10 bg-neutral-700/50" />
                  </div>
                </div>
              </div>
            ) : null}

            <div className="w-full">
              <div className="rounded-md">
                <div className="mb-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-[18px] w-[18px] rounded-sm bg-neutral-200/80" />
                    <ShimmerBar className="h-3 w-20" />
                  </div>
                  <ShimmerBar className="h-8 w-32 max-w-[40%] rounded-md" />
                </div>

                <div className="flex flex-col gap-y-1.5">
                  <TrackRowSkeleton />
                  <TrackRowSkeleton showSubline />
                  <TrackRowSkeleton />
                  <TrackRowSkeleton />
                  <TrackRowSkeleton showSubline />
                  <TrackRowSkeleton />
                  <TrackRowSkeleton />
                  <TrackRowSkeleton />
                </div>
              </div>
            </div>

            {showOtherVersions ? (
              <div className="mt-10 w-full">
                <ShimmerBar className="mb-4 h-3 w-32" />
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="space-y-2">
                      <div className="aspect-square w-full rounded-md border border-neutral-200/80 bg-neutral-200/50" />
                      <ShimmerBar className="h-3 w-4/5 max-w-full" />
                      <ShimmerBar className="h-2.5 w-1/2 max-w-full" />
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </MySection>
    </main>
  );
}
