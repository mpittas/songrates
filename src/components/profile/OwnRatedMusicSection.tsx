"use client";

import { useMemo, useState } from "react";
import { FaStar } from "react-icons/fa";
import { useRatingsContext } from "@/context/RatingsContext";
import ArtistAlbumGridSection from "@/components/artist/ArtistAlbumGridSection";
import ProfileSectionHeader from "@/components/profile/ProfileSectionHeader";
import type { Album } from "@/types/music";

export default function OwnRatedMusicSection() {
  const { albumRatings, ratings } = useRatingsContext();
  const [activeTab, setActiveTab] = useState<"all" | "full" | "partial">("all");
  const [searchQuery, setSearchQuery] = useState("");

  const allUserAlbums = useMemo(
    () => Object.values(albumRatings),
    [albumRatings],
  );

  const fullAlbumsCount = allUserAlbums.filter(
    (a) => a.ratedTrackIds.length >= a.totalTracks && a.totalTracks > 0,
  ).length;

  const partialAlbumsCount = allUserAlbums.filter(
    (a) => a.ratedTrackIds.length > 0 && a.ratedTrackIds.length < a.totalTracks,
  ).length;

  const filteredAlbums: Album[] = useMemo(() => {
    return Object.values(albumRatings)
      .filter((a) => {
        if (activeTab === "all") return true;
        if (activeTab === "full") {
          return a.ratedTrackIds.length >= a.totalTracks && a.totalTracks > 0;
        }
        return (
          a.ratedTrackIds.length > 0 && a.ratedTrackIds.length < a.totalTracks
        );
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
        <div className="py-16 text-center border-2 border-dashed border-neutral-200 rounded-2xl bg-neutral-50">
          <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
            <FaStar size={24} className="text-neutral-400" />
          </div>
          <p className="text-neutral-900 font-bold text-lg mb-1">No albums found</p>
          <p className="text-neutral-500 text-sm">
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
        />
      )}
    </section>
  );
}
