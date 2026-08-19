import { PAGE_CONTAINER } from "@/lib/pageLayout";
import { cn } from "@/lib/utils";

export default function ProfilePageSkeleton() {
  return (
    <main className="min-h-screen bg-stone-100">
      <div className="h-40 animate-pulse bg-neutral-800 sm:h-44 md:h-48" />
      <div className={cn(PAGE_CONTAINER)}>
        <div className="-mt-16 flex flex-col gap-14 lg:flex-row">
          <aside className="w-full shrink-0 lg:w-60">
            <div className="flex flex-col items-center rounded-xl border border-neutral-100 bg-white p-4">
              <div className="-mt-12 mb-3 h-22 w-22 animate-pulse rounded-full bg-neutral-300" />
              <div className="h-5 w-28 animate-pulse rounded-md bg-neutral-200" />
              <div className="mt-2 h-4 w-20 animate-pulse rounded-md bg-neutral-100" />
              <div className="mt-6 w-full space-y-2">
                {Array.from({ length: 6 }).map((_, index) => (
                  <div
                    key={index}
                    className="h-10 w-full animate-pulse rounded-lg bg-neutral-100"
                  />
                ))}
              </div>
            </div>
          </aside>
          <div className="mt-4 flex-1 lg:mt-26">
            <div className="mb-8 h-7 w-40 animate-pulse rounded-md bg-neutral-200" />
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {Array.from({ length: 8 }).map((_, index) => (
                <div key={index} className="space-y-2">
                  <div className="aspect-square animate-pulse rounded-md bg-neutral-200" />
                  <div className="h-3 w-3/4 animate-pulse rounded bg-neutral-200" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
