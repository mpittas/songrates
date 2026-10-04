import {
  CardGridSkeleton,
  SectionHeaderSkeleton,
  Skeleton,
  TrackListSkeleton,
} from "@/components/ui/Skeleton";
import { PAGE_CONTAINER } from "@/lib/pageLayout";
import { cn } from "@/lib/utils";

/** Mirrors `ArtistPageContent`: hero, popular songs, then album grids. */
export default function ArtistSkeleton() {
  return (
    <main className="relative min-h-screen pb-12 text-ink">
      <div className="pointer-events-none absolute inset-x-0 top-0 z-0 h-[500px] bg-gradient-to-b from-[#ece3dc] to-transparent" />

      <div className={cn("relative z-10", PAGE_CONTAINER, "pt-8 sm:pt-12")}>
        <div className="flex flex-col items-center gap-6 md:flex-row md:items-end md:gap-10">
          <Skeleton className="aspect-square w-[min(56vw,220px)] shrink-0 rounded-full md:w-52 lg:w-60" />
          <div className="flex w-full flex-1 flex-col items-center md:items-start">
            <Skeleton className="h-3 w-14" />
            <Skeleton className="mt-4 h-11 w-64 max-w-[80%] sm:h-14 sm:w-96" />
            <div className="mt-4 flex gap-1.5">
              <Skeleton className="h-6 w-14 rounded-full" />
              <Skeleton className="h-6 w-24 rounded-full" />
            </div>
            <div className="mt-6 flex w-full items-center justify-center gap-2 sm:w-auto md:justify-start">
              <Skeleton className="h-12 flex-1 rounded-full sm:w-44 sm:flex-none" />
              <Skeleton className="size-12 rounded-full" />
            </div>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-14 sm:mt-16 sm:gap-16">
          <section>
            <SectionHeaderSkeleton eyebrow={false} />
            <TrackListSkeleton rows={10} columns={2} />
          </section>
          <section>
            <SectionHeaderSkeleton eyebrow={false} />
            <CardGridSkeleton count={6} columns={6} />
          </section>
        </div>
      </div>
    </main>
  );
}
