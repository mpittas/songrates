"use client";

import { useState } from "react";

import MySection from "@/components/ui/MySection";
import type { BrowseSection } from "@/lib/appleMusic/api";
import { cn } from "@/lib/utils";
import PlaylistCard from "@/main-components/PlaylistCard";

const SECTION_TAGLINE: Record<BrowseSection["key"], string> = {
  moods: "Find a playlist for the moment you're in.",
  categories: "Dive deeper into the genres you love.",
};

function CategoryBadge({
  label,
  isActive,
  onClick,
}: {
  label: string;
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "shrink-0 rounded-lg px-3.5 py-2 text-[13px] font-medium tracking-tight transition-all duration-200",
        isActive
          ? "bg-neutral-900 text-white shadow-[0_1px_2px_rgba(0,0,0,0.12)]"
          : "bg-white/90 text-neutral-600 ring-1 ring-neutral-200/90 hover:bg-white hover:text-neutral-900 hover:ring-neutral-300",
      )}
    >
      {label}
    </button>
  );
}

export default function BrowseSectionClient({
  section,
}: {
  section: BrowseSection;
}) {
  const pills = section.pills;
  const [activePillKey, setActivePillKey] = useState(pills[0]?.key ?? "");

  const activePill =
    pills.find((pill) => pill.key === activePillKey) ?? pills[0];
  const activeCount = activePill?.playlists.length ?? 0;
  const sectionTotal = pills.reduce(
    (sum, pill) => sum + pill.playlists.length,
    0,
  );

  return (
    <>
      <div className="sticky top-0 z-30 border-b border-black/5 bg-[#F2EFED]/90 backdrop-blur-md">
        <MySection className="py-4">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-400">
                {section.label}
              </p>
              <p className="mt-1 text-sm text-neutral-600">
                {SECTION_TAGLINE[section.key]}
              </p>
            </div>

            <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-neutral-400">
              {sectionTotal} playlists · {pills.length}{" "}
              {section.label.toLowerCase()}
            </p>
          </div>

          {pills.length > 0 ? (
            <div className="mt-4 flex flex-wrap gap-2">
              {pills.map((pill) => (
                <CategoryBadge
                  key={pill.key}
                  label={pill.label}
                  isActive={pill.key === activePill?.key}
                  onClick={() => setActivePillKey(pill.key)}
                />
              ))}
            </div>
          ) : null}
        </MySection>
      </div>

      <MySection className="py-8">
        <div key={activePill?.key} className="animate-fade-in-up">
          {activePill ? (
            <>
              <div className="mb-6 border-b border-neutral-200/80 pb-5">
                <div className="flex items-start gap-3">
                  <div
                    className="mt-1.5 h-8 w-1 shrink-0 rounded-full bg-[#ed4e39]"
                    aria-hidden
                  />
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-400">
                      {section.label}
                    </p>
                    <h2 className="mt-1 text-2xl font-semibold tracking-tight text-neutral-950">
                      {activePill.label}
                    </h2>
                    <p className="mt-2 text-sm text-neutral-500">
                      {SECTION_TAGLINE[section.key]} · {activeCount} curated
                      playlist{activeCount === 1 ? "" : "s"}.
                    </p>
                  </div>
                </div>
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
