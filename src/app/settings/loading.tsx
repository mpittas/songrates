import MySection from "@/components/ui/MySection";
import { PAGE_CONTENT_TOP } from "@/lib/pageLayout";
import { cn } from "@/lib/utils";

export default function Loading() {
  return (
    <main
      className={cn(
        "min-h-screen bg-[#F2EFED] text-neutral-900",
        PAGE_CONTENT_TOP,
      )}
    >
      <MySection>
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-32 rounded-md bg-neutral-900/10" />
          <div className="h-24 rounded-xl bg-neutral-900/10" />
          <div className="h-24 rounded-xl bg-neutral-900/10" />
          <div className="h-24 rounded-xl bg-neutral-900/10" />
        </div>
      </MySection>
    </main>
  );
}
