"use client";

import { useMemo, useState } from "react";
import { FaStar } from "react-icons/fa";
import { useRatingsContext } from "@/context/RatingsContext";
import ArtistAlbumGridSection from "@/components/artist/ArtistAlbumGridSection";
import ProfileSectionHeader from "@/components/profile/ProfileSectionHeader";
import { isFullyRatedAlbum, isPartiallyRatedAlbum } from "@/lib/albumPageStats";
import type { Album } from "@/types/music";

export default function OwnRatedMusicSection() {
  const { albumRatings, ratings } = useRatingsContext();
  const [activeTab, setActiveTab] = useState<"all" | "full" | "partial">("all");
  const [searchQuery, setSearchQuery] = useState("");

  const allUserAlbums = useMemo(
    () => Object.values(albumRatings).filter((a) => a.ratedTrackIds.length > 0),
    [albumRatings],
  );

  const fullAlbumsCount = allUserAlbums.filter((a) =>
    isFullyRatedAlbum(a.ratedTrackIds.length, a.totalTracks),
  ).length;

  const partialAlbumsCount = allUserAlbums.filter((a) =>
    isPartiallyRatedAlbum(a.ratedTrackIds.length, a.totalTracks),
  ).length;

  const filteredAlbums: Album[] = useMemo(() => {
    return Object.values(albumRatings)
      .filter((a) => a.ratedTrackIds.length > 0)
      .filter((a) => {
        if (activeTab === "all") return true;
        if (activeTab === "full") {
          return isFullyRatedAlbum(a.ratedTrackIds.length, a.totalTracks);
        }
        if (activeTab === "partial") {
          return isPartiallyRatedAlbum(a.ratedTrackIds.length, a.totalTracks);
        }
        return true;
      })
      .filter((a) => {
        const q = searchQuery.trim().toLowerCase();
        if (!q) return true;
        return (
          a.title.toLowerCase().includes(q) ||
          (a.artistName || "").toLowerCase().includes(q)
        );
      })
      .sort((a, b) => (b.ratedAt || "").localeCompare(a.ratedAt || ""))
      .map((a) => {
        let avgRating: number | null = null;
        if (a.ratedTrackIds.length > 0) {
          let sum = 0;
          let count = 0;
          a.ratedTrackIds.forEach((tId) => {
            if (ratings[tId]) {
              sum += ratings[tId];
              count++;
            }
          });
          if (count > 0) avgRating = sum / count;
        }
        return {
          id: a.id,
          title: a.title,
          artistName: a.artistName,
          artworkUrl: a.artworkUrl,
          releaseDate: a.releaseDate,
          rating: avgRating,
        };
      });
  }, [albumRatings, ratings, activeTab, searchQuery]);

  return (
    <section>
      <ProfileSectionHeader
        title="Rated Albums"
        filters={[
          { id: "all", label: "All", count: allUserAlbums.length },
          { id: "full", label: "Fully rated", count: fullAlbumsCount },
          {
            id: "partial",
            label: "Partially rated",
            count: partialAlbumsCount,
          },
        ]}
        activeFilterId={activeTab}
        onFilterChange={(id) => setActiveTab(id as "all" | "full" | "partial")}
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Search albums..."
      />

      {filteredAlbums.length === 0 ? (
        <div className="py-20 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-white ring-1 ring-neutral-200">
            <FaStar size={20} className="text-neutral-400" />
          </div>
          <p className="mb-1 text-base font-semibold text-neutral-900">
            No albums found
          </p>
          <p className="text-sm text-neutral-500">
            {activeTab === "full"
              ? "You haven't fully rated any albums yet"
              : activeTab === "partial"
                ? "You have no partially rated albums"
                : "Rate tracks on any album page to see them here"}
          </p>
        </div>
      ) : (
        <ArtistAlbumGridSection
          albums={filteredAlbums}
          initialCount={12}
          ratingMode="any"
          showRemoveAllRatings
        />
      )}
    </section>
  );
}
