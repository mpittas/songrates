"use client";

import SearchBar from "@/components/search/SearchBar";
import MySection from "@/components/ui/MySection";
import dynamic from "next/dynamic";
import { Suspense } from "react";

const Silk = dynamic(() => import("@/components/mesh/Silk"), {
  ssr: false,
  loading: () => (
    <div className="absolute inset-0 bg-[radial-gradient(circle_at_0%_20%,#ff7f5f_0%,#f05f45_18%,#8f1d28_40%,#181018_72%,#0f0c11_100%)]" />
  ),
});

export default function HomeHero() {
  return (
    <section className="px-2 pt-2">
      <div className="relative rounded-2xl">
        <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-2xl">
          <Silk
            color="#ed4e39"
            speed={4}
            scale={1.15}
            noiseIntensity={1.25}
            rotation={0.12}
          />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_0%_20%,rgba(255,127,95,0.35)_0%,rgba(143,29,40,0.2)_35%,transparent_65%)]" />
          <div className="absolute inset-0 bg-[linear-gradient(120deg,rgba(255,255,255,0.18)_0%,rgba(255,255,255,0)_30%)]" />
        </div>

        <MySection className="relative z-10 overflow-visible py-14 sm:py-16">
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
        </MySection>
      </div>
    </section>
  );
}
