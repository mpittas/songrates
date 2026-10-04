"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import FilterChips from "@/components/ui/FilterChips";
import {
  type ApplePlaylistResult,
  type BrowsePill,
} from "@/lib/appleMusic/api";
import PlaylistCard from "@/main-components/PlaylistCard";

const PAGE_SIZE = 20;
const ALL_MOODS = "all";

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
  const chips = [
    { key: ALL_MOODS, label: "All" },
    ...moods.map((mood) => ({ key: mood.key, label: mood.label })),
  ];

  return (
    <div>
      <FilterChips
        items={chips}
        activeKey={activeKey}
        onChange={(key) => {
          setActiveKey(key);
          window.scrollTo({ top: 0, behavior: "smooth" });
        }}
        ariaLabel="Filter by mood"
      />

      <div
        key={activeKey}
        className="animate-fade-in-up mt-6 grid grid-cols-2 gap-x-4 gap-y-8 sm:mt-8 sm:grid-cols-3 md:grid-cols-4 md:gap-x-5 lg:grid-cols-5"
      >
        {visible.map((playlist, index) => (
          <PlaylistCard key={playlist.id} playlist={playlist} index={index} />
        ))}
      </div>

      {visibleCount < activePlaylists.length ? (
        <div ref={sentinelRef} className="h-10" aria-hidden />
      ) : null}
    </div>
  );
}
