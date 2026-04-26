"use client";

import SearchBar from "@/components/search/SearchBar";
import MySection from "@/components/ui/MySection";
import { Suspense } from "react";

export default function HomeHero() {
  return (
    <section className="relative border-b border-black/10">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_0%_20%,#ff7f5f_0%,#f05f45_18%,#8f1d28_40%,#181018_72%,#0f0c11_100%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(120deg,rgba(255,255,255,0.18)_0%,rgba(255,255,255,0)_30%)]" />

      <MySection className="relative z-10 py-14 sm:py-16">
        <div className="mx-auto flex w-full max-w-3xl flex-col items-center text-center">
          <h1 className="text-4xl font-medium tracking-tight text-white sm:text-5xl">
            Discover and Rate Music
          </h1>

          <div className="mt-7 w-full max-w-[640px]">
            <Suspense fallback={null}>
              <SearchBar />
            </Suspense>
          </div>
        </div>
      </MySection>
    </section>
  );
}
