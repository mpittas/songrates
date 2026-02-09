"use client";

import CollapsibleSection from "@/components/ui/CollapsibleSection";
import { useRatings } from "@/hooks/useRatings";

import { Album, GroupedReleases, Release } from "@/types/music";

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
  mainAlbums: (Album | Release)[];
  onSelectAlbum: (id: string) => void;
  initialReleases?: GroupedReleases;
  searchQuery?: string;
  sortBy?: "newest" | "oldest" | "title" | "popularity";
}) {
  const releases = initialReleases;
  const { getAlbumRating } = useRatings();

  const processList = (list: (Album | Release)[]) => {
    let result = [...list];

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter((r) => r.title.toLowerCase().includes(q));
    }

    result.sort((a, b) => {
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
      key: "Singles",
      data: processList(releases["Singles"] || []),
      layout: "list" as const,
      tooltip: "Individual songs and guest appearances.",
    },
    {
      key: "Compilations",
      data: processList(releases["Compilations"] || []),
      layout: "grid" as const,
      tooltip: "Compilation albums.",
    },
  ];

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
    </div>
  );
}
