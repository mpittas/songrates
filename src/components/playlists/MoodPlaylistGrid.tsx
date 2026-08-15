"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import {
  type ApplePlaylistResult,
  type BrowsePill,
} from "@/lib/appleMusic/api";
import { cn } from "@/lib/utils";
import PlaylistCard from "@/main-components/PlaylistCard";

const PAGE_SIZE = 16;
const ALL_MOODS = "all";

function MoodButton({
  label,
  isActive,
  onClick,
  compact,
}: {
  label: string;
  isActive: boolean;
  onClick: () => void;
  compact?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "shrink-0 text-left font-medium tracking-tight transition-colors",
        compact
          ? "rounded-full px-3 py-1.5 text-[13px]"
          : "w-full rounded-md px-2.5 py-1.5 text-[13px]",
        isActive
          ? "bg-neutral-900 text-white"
          : compact
            ? "bg-white/90 text-neutral-600 ring-1 ring-neutral-200/90 hover:text-neutral-900"
            : "text-neutral-500 hover:bg-white hover:text-neutral-900",
      )}
    >
      {label}
    </button>
  );
}

export default function MoodPlaylistGrid({
  playlists,
  moods,
}: {
  playlists: ApplePlaylistResult[];
  moods: BrowsePill[];
}) {
  const [activeKey, setActiveKey] = useState(ALL_MOODS);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const activePlaylists = useMemo(() => {
    if (activeKey === ALL_MOODS) return playlists;
    return moods.find((mood) => mood.key === activeKey)?.playlists ?? playlists;
  }, [activeKey, moods, playlists]);

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [activeKey]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries[0]?.isIntersecting) return;
        setVisibleCount((count) =>
          Math.min(count + PAGE_SIZE, activePlaylists.length),
        );
      },
      { rootMargin: "600px 0px" },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [activePlaylists.length, activeKey]);

  const visible = activePlaylists.slice(0, visibleCount);

  const moodButtons = (
    <>
      <MoodButton
        label="All"
        isActive={activeKey === ALL_MOODS}
        onClick={() => setActiveKey(ALL_MOODS)}
      />
      {moods.map((mood) => (
        <MoodButton
          key={mood.key}
          label={mood.label}
          isActive={activeKey === mood.key}
          onClick={() => setActiveKey(mood.key)}
        />
      ))}
    </>
  );

  return (
    <div>
      <div className="sticky top-16 z-20 -mx-4 mb-5 border-b border-black/5 bg-[#F2EFED]/90 px-4 py-2.5 backdrop-blur-md lg:hidden">
        <div className="flex gap-1.5 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <MoodButton
            compact
            label="All"
            isActive={activeKey === ALL_MOODS}
            onClick={() => setActiveKey(ALL_MOODS)}
          />
          {moods.map((mood) => (
            <MoodButton
              key={mood.key}
              compact
              label={mood.label}
              isActive={activeKey === mood.key}
              onClick={() => setActiveKey(mood.key)}
            />
          ))}
        </div>
      </div>

      <div className="lg:grid lg:grid-cols-[9.5rem_minmax(0,1fr)] lg:items-start lg:gap-8">
        <aside className="sticky top-24 hidden self-start lg:block">
          <nav className="flex flex-col gap-0.5">{moodButtons}</nav>
        </aside>

        <div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-3">
            {visible.map((playlist, index) => (
              <PlaylistCard
                key={`${activeKey}-${playlist.id}`}
                playlist={playlist}
                index={index}
              />
            ))}
          </div>

          {visibleCount < activePlaylists.length ? (
            <div ref={sentinelRef} className="h-10" aria-hidden />
          ) : null}
        </div>
      </div>
    </div>
  );
}
