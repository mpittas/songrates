import MySection from "@/components/ui/MySection";
import { Skeleton } from "@/components/ui/Skeleton";
import { PAGE_CONTENT_TOP } from "@/lib/pageLayout";
import { cn } from "@/lib/utils";

export default function Loading() {
  return (
    <main aria-busy="true" aria-label="Loading settings" className="min-h-screen bg-canvas text-ink">
      <MySection className={cn(PAGE_CONTENT_TOP, "pb-28")}>
        <div className="mx-auto max-w-xl space-y-6">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-12 w-48" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-16 w-60" />
          <Skeleton className="h-28 w-full rounded-xl" />
          <Skeleton className="h-48 w-full rounded-xl" />
        </div>
      </MySection>
    </main>
  );
}
