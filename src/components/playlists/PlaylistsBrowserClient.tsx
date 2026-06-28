"use client";

import { useState } from "react";
import MySection from "@/components/ui/MySection";
import PlaylistCard from "@/main-components/PlaylistCard";
import type { AppleBrowseData } from "@/lib/appleMusic/api";

type SectionKey = AppleBrowseData["moods"]["key"];

const SECTION_ORDER: SectionKey[] = ["moods", "categories"];

const SECTION_TAGLINE: Record<SectionKey, string> = {
  moods: "Find a playlist for the moment you're in.",
  categories: "Dive deeper into the genres you love.",
};

export default function PlaylistsBrowserClient({
  data,
}: {
  data: AppleBrowseData;
}) {
  const [section, setSection] = useState<SectionKey>(() =>
    data.moods.pills.length > 0 ? "moods" : "categories",
  );

  // Remember the active pill per section so toggling back restores selection.
  const [activePillKey, setActivePillKey] = useState<Record<SectionKey, string>>(
    {
      moods: data.moods.pills[0]?.key ?? "",
      categories: data.categories.pills[0]?.key ?? "",
    },
  );

  const pills = data[section].pills;
  const activePill =
    pills.find((p) => p.key === activePillKey[section]) ?? pills[0];
  const activeCount = activePill?.playlists.length ?? 0;
  const sectionTotal = pills.reduce((sum, pill) => sum + pill.playlists.length, 0);

  return (
    <>
      {/* Sticky filter bar: segmented control + sub-pills */}
      <div className="sticky top-0 z-30 border-b border-black/5 bg-[#F2EFED]/90 backdrop-blur-md">
        <MySection className="py-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            {/* Segmented control (the two main sections) */}
            <div className="inline-flex rounded-full bg-black/5 p-1">
              {SECTION_ORDER.map((key) => {
                const disabled = data[key].pills.length === 0;
                return (
                  <button
                    key={key}
                    type="button"
                    disabled={disabled}
                    onClick={() => setSection(key)}
                    className={`rounded-full px-5 py-1.5 text-sm font-semibold transition-colors ${
                      section === key
                        ? "bg-[#1f1f1f] text-white shadow-sm"
                        : "text-neutral-500 hover:text-neutral-900"
                    } ${disabled ? "cursor-not-allowed opacity-40" : ""}`}
                  >
                    {data[key].label}
                  </button>
                );
              })}
            </div>

            <p className="hidden font-mono text-[11px] uppercase tracking-[0.18em] text-neutral-400 sm:block">
              {sectionTotal} playlists · {pills.length}{" "}
              {data[section].label.toLowerCase()}
            </p>
          </div>

          {/* Sub-pills (filter within the active section) */}
          {pills.length > 0 && (
            <div className="mt-3 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {pills.map((pill) => {
                const isActive = pill.key === activePill?.key;
                return (
                  <button
                    key={pill.key}
                    type="button"
                    onClick={() =>
                      setActivePillKey((prev) => ({
                        ...prev,
                        [section]: pill.key,
                      }))
                    }
                    className={`flex shrink-0 items-center gap-1.5 rounded-full border px-4 py-1.5 text-sm font-medium transition-all duration-200 ${
                      isActive
                        ? "border-[#1f1f1f] bg-[#1f1f1f] text-white shadow-sm"
                        : "border-[#dededa] bg-white text-neutral-600 hover:-translate-y-0.5 hover:border-neutral-300 hover:text-neutral-900"
                    }`}
                  >
                    <span aria-hidden>{pill.emoji}</span>
                    {pill.label}
                  </button>
                );
              })}
            </div>
          )}
        </MySection>
      </div>

      {/* Active pill content */}
      <MySection className="py-8">
        <div
          key={`${section}-${activePill?.key}`}
          className="animate-fade-in-up"
        >
          {activePill ? (
            <>
              <div className="mb-6">
                <div className="flex items-center gap-3">
                  <span
                    className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-neutral-900 text-xl"
                    aria-hidden
                  >
                    {activePill.emoji}
                  </span>
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-400">
                      {data[section].label}
                    </p>
                    <h2 className="text-2xl font-semibold tracking-tight text-neutral-950">
                      {activePill.label}
                    </h2>
                  </div>
                </div>
                <p className="mt-2 text-sm text-neutral-500">
                  {SECTION_TAGLINE[section]} · {activeCount} curated playlist
                  {activeCount === 1 ? "" : "s"}.
                </p>
              </div>

              {activeCount > 0 ? (
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                  {activePill.playlists.map((playlist, index) => (
                    <PlaylistCard
                      key={playlist.id}
                      playlist={playlist}
                      index={index}
                    />
                  ))}
                </div>
              ) : (
                <div className="rounded-2xl border border-neutral-200 bg-white p-8 text-center text-sm text-neutral-500">
                  No playlists found for this selection.
                </div>
              )}
            </>
          ) : (
            <div className="rounded-2xl border border-neutral-200 bg-white p-8 text-center text-sm text-neutral-500">
              No playlists available right now.
            </div>
          )}
        </div>
      </MySection>
    </>
  );
}
