"use client";

import { useEffect, useState } from "react";
import AlbumGrid from "@/components/album/AlbumGrid";
import CollapsibleSection from "@/components/ui/CollapsibleSection";
import { useQuery } from "@tanstack/react-query";
import { useRatings } from "@/hooks/useRatings";

import { Album, GroupedReleases, Release } from "@/types/music";

type AlbumType = Release & { wikipediaUrl?: string };

const FILTER_OUT_CATEGORIES = ["Compilations", "Live"];

// Helper component moved to @/components/CollapsibleSection

export default function Discography({
  artistId,
  artistName,
  mainAlbums,
  onSelectAlbum,
  initialReleases = {},
  searchQuery,
  sortBy,
}: {
  artistId: string;
  artistName: string;
  mainAlbums: AlbumType[];
  onSelectAlbum: (id: string) => void;
  initialReleases?: GroupedReleases;
  searchQuery?: string;
  sortBy?: "newest" | "oldest" | "title" | "popularity";
}) {
  const [releases, setReleases] = useState<GroupedReleases>(initialReleases);
  const [loading, setLoading] = useState(
    Object.keys(initialReleases).length === 0,
  );

  useEffect(() => {
    if (Object.keys(initialReleases).length > 0 || !artistId) return;

    fetch(`/api/musicbrainz/other-releases?id=${artistId}`)
      .then((res) => res.json())
      .then((data) => {
        setReleases(data.releases || {});
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [artistId, initialReleases]);

  const { getAlbumRating } = useRatings();

  const { data: popularityScores = {} } = useQuery({
    queryKey: ["artist-popularity", artistName],
    queryFn: async () => {
      if (!artistName) return {};
      const res = await fetch(
        `/api/lastfm/popularity?artistName=${encodeURIComponent(artistName)}`,
      );
      return res.ok ? res.json() : {};
    },
    enabled: !!artistName,
    staleTime: Infinity,
  });

  const processList = (list: Release[]) => {
    let result = [...list];

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter((r) => r.title.toLowerCase().includes(q));
    }

    result.sort((a, b) => {
      if (sortBy === "popularity") {
        const scoreA = popularityScores[a.title.toLowerCase().trim()] || 0;
        const scoreB = popularityScores[b.title.toLowerCase().trim()] || 0;
        if (scoreB !== scoreA) return scoreB - scoreA;
      }
      if (sortBy === "title") return a.title.localeCompare(b.title);
      if (sortBy === "oldest")
        return (a.releaseDate || "").localeCompare(b.releaseDate || "");
      // Default to newest
      return (b.releaseDate || "").localeCompare(a.releaseDate || "");
    });

    return result.map((r) => ({ ...r, rating: getAlbumRating(r.id) }));
  };

  const sections = [
    {
      key: "Albums",
      data: processList(mainAlbums),
      layout: "grid" as const,
      tooltip: "Full-length studio albums.",
    },
    {
      key: "EPs",
      data: processList(releases["EPs"] || []),
      layout: "grid" as const,
      tooltip: "Extended Plays.",
    },
    {
      key: "Other Albums",
      data: processList(releases["Other Albums"] || []),
      layout: "grid" as const,
      tooltip: "Live, compilations, remixes.",
    },
    {
      key: "Singles & Features",
      data: processList(releases["Singles"] || []),
      layout: "list" as const,
      tooltip: "Individual songs and guest appearances.",
    },
  ];

  const miscCategories = Object.keys(releases)
    .filter(
      (k) =>
        !["EPs", "Other Albums", "Singles", "Other"].includes(k) &&
        !FILTER_OUT_CATEGORIES.some((f) => k.includes(f)),
    )
    .map((k) => ({
      key: k,
      data: processList(releases[k]),
      layout: "list" as const,
    }));

  return (
    <div className="space-y-4">
      {sections.map(
        (s) =>
          s.data.length > 0 && (
            <CollapsibleSection
              key={s.key}
              title={s.key}
              releases={s.data}
              onSelectAlbum={onSelectAlbum}
              layout={s.layout}
              tooltipText={s.tooltip}
              gridCols={3}
            />
          ),
      )}

      {loading && (
        <div className="py-12 flex justify-center">
          <div className="text-neutral-700 text-[10px] font-mono animate-pulse uppercase tracking-widest">
            loading_releases...
          </div>
        </div>
      )}

      {miscCategories.map(
        (s) =>
          s.data.length > 0 && (
            <CollapsibleSection
              key={s.key}
              title={s.key}
              releases={s.data}
              onSelectAlbum={onSelectAlbum}
              layout={s.layout}
              gridCols={3}
            />
          ),
      )}
    </div>
  );
}
