"use client";

import { useEffect, useState } from "react";
import AlbumGrid from "@/components/AlbumGrid";
import CollapsibleSection from "@/components/CollapsibleSection";
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
    if (Object.keys(initialReleases).length > 0) return;
    if (!artistId) return;

    fetch(`/api/musicbrainz/other-releases?artistId=${artistId}`)
      .then((res) => res.json())
      .then((data) => {
        setReleases(data.releases || {});
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [artistId, initialReleases]);

  const { getAlbumRating } = useRatings();

  // key: "artist-popularity", artistName
  const { data: popularityScores = {} } = useQuery({
    queryKey: ["artist-popularity", artistName],
    queryFn: async () => {
      if (!artistName) return {};
      const res = await fetch(
        `/api/lastfm/popularity?artistName=${encodeURIComponent(artistName)}`,
      );
      if (!res.ok) throw new Error("Popularity fetch failed");
      return res.json() as Promise<Record<string, number>>;
    },
    enabled: !!artistName,
    staleTime: Infinity, // Popularity doesn't change often in a session
  });

  const sortReleases = (list: Release[]) => {
    const sorted = [...list];

    if (sortBy === "popularity") {
      return sorted.sort((a, b) => {
        const titleA = a.title.toLowerCase().trim();
        const titleB = b.title.toLowerCase().trim();
        const scoreA = popularityScores[titleA] || 0;
        const scoreB = popularityScores[titleB] || 0;

        // Secondary sort by date if scores are equal?
        if (scoreB === scoreA) {
          return (b.releaseDate || "").localeCompare(a.releaseDate || "");
        }
        return scoreB - scoreA;
      });
    }

    // If we want to support other sorts for the "other releases" (which are fetched internally):
    if (sortBy === "newest") {
      return sorted.sort((a, b) =>
        (b.releaseDate || "").localeCompare(a.releaseDate || ""),
      );
    }
    if (sortBy === "oldest") {
      return sorted.sort((a, b) =>
        (a.releaseDate || "").localeCompare(b.releaseDate || ""),
      );
    }
    if (sortBy === "title") {
      return sorted.sort((a, b) => a.title.localeCompare(b.title));
    }

    return sorted;
  };

  const filterReleases = (list: Release[]) => {
    if (!searchQuery) return list;
    const lowerQuery = searchQuery.toLowerCase();
    return list.filter((r) => r.title.toLowerCase().includes(lowerQuery));
  };

  const getReleases = (key: string) => {
    const filtered = filterReleases(releases[key] || []);
    const sorted = sortReleases(filtered);
    return sorted.map((r) => ({ ...r, rating: getAlbumRating(r.id) }));
  };

  const eps = getReleases("EPs");
  const otherAlbums = getReleases("Other Albums");
  const singles = getReleases("Singles");

  // Collect other miscellaneous categories
  const miscCategories = Object.keys(releases).filter(
    (key) =>
      !["EPs", "Other Albums", "Singles", "Other"].includes(key) &&
      !FILTER_OUT_CATEGORIES.some(
        (filter) => key.includes(filter) || key === filter,
      ) &&
      getReleases(key).length > 0,
  );

  // Apply popularity sort to mainAlbums as well (if popularity is selected)
  // For other sorts, mainAlbums is already passed sorted from parent, but doing it here again doesn't hurt.
  const processedMainAlbums = sortReleases(filterReleases(mainAlbums)).map(
    (r) => ({
      ...r,
      rating: getAlbumRating(r.id),
    }),
  );

  return (
    <div className="bg-[#222]/40 p-4 space-y-2">
      {/* Main Albums */}
      {processedMainAlbums.length > 0 && (
        <CollapsibleSection
          title="Albums"
          releases={processedMainAlbums}
          onSelectAlbum={onSelectAlbum}
          layout="grid"
          defaultOpen={true}
          tooltipText="Full-length studio albums, typically containing 7+ tracks."
        />
      )}

      {/* EPs */}
      {!loading && eps.length > 0 && (
        <CollapsibleSection
          title="EPs"
          releases={eps as AlbumType[]}
          onSelectAlbum={onSelectAlbum}
          layout="grid"
          defaultOpen={true}
          tooltipText="Extended Plays. Shorter than albums but longer than singles (usually 3-6 tracks)."
        />
      )}

      {/* Other Albums */}
      {!loading && otherAlbums.length > 0 && (
        <CollapsibleSection
          title="Other Albums"
          releases={otherAlbums as AlbumType[]}
          onSelectAlbum={onSelectAlbum}
          layout="grid"
          defaultOpen={true}
          tooltipText="Live albums, compilations, remixes, and soundtracks."
        />
      )}

      {loading && (
        <div className="py-12 flex justify-center">
          <div className="text-neutral-600 text-xs font-mono animate-pulse">
            loading_more_releases...
          </div>
        </div>
      )}

      {!loading && (
        <>
          {/* Singles */}
          {singles.length > 0 && (
            <CollapsibleSection
              title="Singles & Features"
              releases={singles as AlbumType[]}
              onSelectAlbum={onSelectAlbum}
              layout="list"
              defaultOpen={true}
              tooltipText="Individual songs, guest appearances, and stand-alone releases."
            />
          )}

          {/* Misc Categories */}
          {miscCategories.map((category) => (
            <CollapsibleSection
              key={category}
              title={category}
              releases={getReleases(category) as AlbumType[]}
              onSelectAlbum={onSelectAlbum}
              layout="list"
              defaultOpen={true}
              tooltipText="Miscellaneous releases not fitting into standard categories."
            />
          ))}
        </>
      )}
    </div>
  );
}
