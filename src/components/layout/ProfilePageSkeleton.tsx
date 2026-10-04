import { PAGE_CONTAINER } from "@/lib/pageLayout";
import { cn } from "@/lib/utils";
import { Skeleton, CardGridSkeleton, SectionHeaderSkeleton } from "@/components/ui/Skeleton";

export default function ProfilePageSkeleton() {
  return (
    <main aria-busy="true" aria-label="Loading profile" className="min-h-screen bg-canvas pb-16">
      <div className={cn(PAGE_CONTAINER, "py-8 sm:py-12")}>
        <div className="flex flex-col gap-8 lg:flex-row lg:gap-10">
          <aside className="w-full shrink-0 lg:w-60">
            <div className="rounded-2xl border border-line bg-surface p-5 shadow-card">
              <Skeleton className="mb-5 h-3 w-28" />
              <div className="flex items-center gap-4 lg:flex-col lg:items-start">
                <Skeleton className="size-16 shrink-0 rounded-full lg:size-20" />
                <div className="w-full space-y-2"><Skeleton className="h-6 w-32" /><Skeleton className="h-3 w-24" /></div>
              </div>
              <Skeleton className="mt-5 h-12 w-full" />
              <Skeleton className="mt-5 h-8 w-full rounded-full" />
            </div>
            <div className="mt-5 hidden space-y-2 lg:block">
              {Array.from({ length: 7 }).map((_, i) => <Skeleton key={i} className="h-10 w-full rounded-xl" />)}
            </div>
          </aside>
          <div className="min-w-0 flex-1 lg:pt-1">
            <SectionHeaderSkeleton eyebrow={false} />
            <CardGridSkeleton count={8} columns={4} />
          </div>
        </div>
      </div>
    </main>
  );
}
