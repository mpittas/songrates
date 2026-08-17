import MySection from "@/components/ui/MySection";
import { PAGE_CONTENT_TOP } from "@/lib/pageLayout";
import { cn } from "@/lib/utils";

export default function BrowsePageSkeleton({
  cards = 12,
}: {
  cards?: number;
}) {
  return (
    <main
      className={cn(
        "min-h-screen bg-[#F2EFED] pb-16 text-neutral-900",
        PAGE_CONTENT_TOP,
      )}
    >
      <MySection className="pb-8">
        <div className="animate-pulse">
          <div className="h-8 w-40 rounded-md bg-neutral-900/10" />
          <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: cards }).map((_, index) => (
              <div key={index} className="space-y-2">
                <div className="aspect-square rounded-xl bg-neutral-900/10" />
                <div className="h-3 w-3/4 rounded bg-neutral-900/10" />
                <div className="h-2.5 w-1/2 rounded bg-neutral-900/10" />
              </div>
            ))}
          </div>
        </div>
      </MySection>
    </main>
  );
}
