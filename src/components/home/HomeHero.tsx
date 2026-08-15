import SearchBar from "@/components/search/SearchBar";
import { PAGE_CONTAINER_WIDTH } from "@/lib/pageLayout";
import { cn } from "@/lib/utils";
import { Suspense } from "react";

export default function HomeHero() {
  return (
    <section className="px-2 pt-2">
      <div
        className={cn(
          PAGE_CONTAINER_WIDTH,
          "relative overflow-hidden rounded-2xl",
        )}
      >
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_0%_20%,#ff7f5f_0%,#f05f45_18%,#8f1d28_40%,#181018_72%,#0f0c11_100%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_0%_20%,rgba(255,127,95,0.35)_0%,rgba(143,29,40,0.2)_35%,transparent_65%)]" />
          <div className="absolute inset-0 bg-[linear-gradient(120deg,rgba(255,255,255,0.18)_0%,rgba(255,255,255,0)_30%)]" />
        </div>

        <div className="relative z-10 px-4 py-14 sm:px-6 sm:py-16">
          <div className="mx-auto flex w-full max-w-3xl flex-col items-center text-center">
            <h1 className="text-4xl font-medium tracking-tight text-white sm:text-5xl">
              Discover and Rate Music
            </h1>

            <div className="relative z-20 mt-7 w-full max-w-[640px] overflow-visible">
              <Suspense fallback={null}>
                <SearchBar variant="glass" />
              </Suspense>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
