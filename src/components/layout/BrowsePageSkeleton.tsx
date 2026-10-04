import MySection from "@/components/ui/MySection";
import {
  CardGridSkeleton,
  SectionHeaderSkeleton,
  Skeleton,
} from "@/components/ui/Skeleton";
import { PAGE_CONTAINER } from "@/lib/pageLayout";
import { cn } from "@/lib/utils";

/** Matches `PageHeader` so browse pages don't jump when data arrives. */
export function PageHeaderSkeleton({ chips = false }: { chips?: boolean }) {
  return (
    <div className={cn(PAGE_CONTAINER, "pt-8 pb-8 sm:pt-14 sm:pb-10")}>
      <Skeleton className="mb-4 h-3 w-16" />
      <Skeleton className="h-10 w-48 sm:h-14 sm:w-72" />
      <Skeleton className="mt-4 h-4 w-80 max-w-full" />
      {chips ? (
        <div className="mt-6 flex gap-2 overflow-hidden sm:mt-8">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-9 w-20 shrink-0 rounded-full" />
          ))}
        </div>
      ) : null}
    </div>
  );
}

export default function BrowsePageSkeleton({
  cards = 12,
  chips = false,
}: {
  cards?: number;
  chips?: boolean;
}) {
  return (
    <main className="min-h-screen pb-6 text-ink">
      <PageHeaderSkeleton chips={chips} />
      <MySection className="pb-10">
        {chips ? null : <SectionHeaderSkeleton eyebrow={false} />}
        <CardGridSkeleton count={cards} columns={6} />
      </MySection>
    </main>
  );
}
