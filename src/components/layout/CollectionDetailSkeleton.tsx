import {
  CardGridSkeleton,
  SectionHeaderSkeleton,
  Skeleton,
  TrackListSkeleton,
} from "@/components/ui/Skeleton";
import { PAGE_CONTAINER } from "@/lib/pageLayout";
import { cn } from "@/lib/utils";

/** Mirrors `CollectionDetailPageLayout` (album + playlist pages). */
export default function CollectionDetailSkeleton({
  showTopBarRight = false,
  showRatingRow = false,
  showOtherVersions = false,
}: {
  /** Reserve room for secondary hero actions (like, save, reviews). */
  showTopBarRight?: boolean;
  showRatingRow?: boolean;
  showOtherVersions?: boolean;
}) {
  return (
    <main className="relative min-h-screen pb-12 text-ink">
      <div className="pointer-events-none absolute inset-x-0 top-0 z-0 h-[500px] bg-gradient-to-b from-[#ece3dc] to-transparent" />

      <div className={cn("relative z-10", PAGE_CONTAINER, "pt-4 sm:pt-6")}>
        <Skeleton className="h-7 w-28 rounded-full" />

        <div className="mt-5 flex flex-col items-center gap-6 sm:mt-8 md:flex-row md:items-end md:gap-10">
          <Skeleton className="aspect-square w-[min(68vw,280px)] shrink-0 rounded-2xl md:w-60 lg:w-72" />
          <div className="flex w-full flex-1 flex-col items-center md:items-start">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="mt-4 h-9 w-[min(28rem,80%)] sm:h-12" />
            <Skeleton className="mt-4 h-5 w-32" />
            <Skeleton className="mt-3 h-4 w-48" />
            <div className="mt-6 flex w-full items-center justify-center gap-2 sm:w-auto md:justify-start">
              <Skeleton className="h-12 flex-1 rounded-full sm:w-36 sm:flex-none" />
              {showTopBarRight ? (
                <>
                  <Skeleton className="size-12 rounded-full" />
                  <Skeleton className="size-12 rounded-full" />
                  <Skeleton className="h-12 w-20 rounded-full" />
                </>
              ) : null}
            </div>
          </div>
        </div>

        {showRatingRow ? (
          <div className="mt-10 grid grid-cols-2 gap-3 sm:mt-12 sm:gap-4">
            {[0, 1].map((key) => (
              <div key={key} className="rounded-2xl bg-surface p-4 shadow-card sm:p-5">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="mt-4 h-10 w-20" />
                <Skeleton className="mt-3 h-3.5 w-32 max-w-full" />
              </div>
            ))}
          </div>
        ) : null}

        <section className="mt-10 sm:mt-12">
          <SectionHeaderSkeleton eyebrow={false} />
          <TrackListSkeleton rows={10} />
        </section>

        {showOtherVersions ? (
          <section className="mt-12 sm:mt-16">
            <SectionHeaderSkeleton eyebrow={false} />
            <CardGridSkeleton count={6} columns={6} />
          </section>
        ) : null}
      </div>
    </main>
  );
}
