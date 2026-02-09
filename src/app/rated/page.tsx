"use client";

import { useRatingsContext as useRatings } from "@/context/RatingsContext";
import { useMemo, useState } from "react";
import MySection from "@/components/ui/MySection";
import AlbumGrid from "@/components/album/AlbumGrid";
import DropdownFilter from "@/components/ui/DropdownFilter";
import SearchInput from "@/components/search/SearchInput";

type FilterType = "all" | "full" | "partial";

export default function RatedAlbumsPage() {
  const { albumRatings, getAlbumRating } = useRatings();
  const [statusFilter, setStatusFilter] = useState<FilterType>("all");
  const [ratingFilter, setRatingFilter] = useState<number>(11); // 11 means "All" (below 11)
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [sortFilter, setSortFilter] = useState<string>("newest");
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  const albums = useMemo(() => {
    const allAlbums = Object.values(albumRatings).filter(
      (a) => a.ratedTrackIds.length > 0,
    );

    const mapped = allAlbums.map((a) => {
      const isFull =
        a.ratedTrackIds.length >= a.totalTracks && a.totalTracks > 0;
      const rating = getAlbumRating(a.id);

      // Infer category from track count (heuristic)
      let category = "album";
      if (a.totalTracks <= 2) category = "single";
      else if (a.totalTracks <= 6) category = "ep";

      return {
        id: a.id,
        title: a.title,
        artistName: a.artistName,
        releaseDate: a.releaseDate,
        rating: rating,
        status: isFull ? "full" : "partial",
        category,
        totalTracks: a.totalTracks,
        ratedAt: a.ratedAt,
      };
    });

    return mapped.sort((a, b) => {
      if (sortFilter === "newest") {
        // Sort by ratedAt desc
        return (b.ratedAt || "").localeCompare(a.ratedAt || "");
      }
      if (sortFilter === "oldest") {
        return (a.ratedAt || "").localeCompare(b.ratedAt || "");
      }
      if (sortFilter === "artist") {
        const artistCompare = (a.artistName || "").localeCompare(
          b.artistName || "",
        );
        if (artistCompare !== 0) return artistCompare;
        return a.title.localeCompare(b.title);
      }
      if (sortFilter === "title") {
        return a.title.localeCompare(b.title);
      }
      return 0;
    });
  }, [albumRatings, getAlbumRating, sortFilter]);

  const filteredAlbums = useMemo(() => {
    return albums.filter((a) => {
      // Search Filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matches =
          a.title.toLowerCase().includes(query) ||
          a.artistName.toLowerCase().includes(query);
        if (!matches) return false;
      }

      // Status Filter
      if (statusFilter !== "all" && a.status !== statusFilter) return false;

      // Rating Filter (Below X)
      if (ratingFilter < 11) {
        if (a.rating === null || a.rating >= ratingFilter) return false;
      }

      // Category Filter
      if (categoryFilter !== "all") {
        if (categoryFilter === "other") {
          return false;
        }
        if (a.category !== categoryFilter) return false;
      }

      return true;
    });
  }, [albums, statusFilter, ratingFilter, categoryFilter, searchQuery]);

  const statusOptions = [
    { label: "All Status", value: "all" },
    { label: "Fully Rated", value: "full" },
    { label: "Partially Rated", value: "partial" },
  ];

  const categoryOptions = [
    { label: "All Categories", value: "all" },
    { label: "LP / Album", value: "album" },
    { label: "EP", value: "ep" },
    { label: "Single", value: "single" },
  ];

  const ratingOptions = [
    { label: "All Ratings", value: 11 },
    { label: "Below 10", value: 10 },
    { label: "Below 9", value: 9 },
    { label: "Below 8", value: 8 },
    { label: "Below 7", value: 7 },
    { label: "Below 6", value: 6 },
    { label: "Below 5", value: 5 },
    { label: "Below 4", value: 4 },
    { label: "Below 3", value: 3 },
    { label: "Below 2", value: 2 },
  ];

  const sortOptions = [
    { label: "Latest Rated", value: "newest" },
    { label: "Oldest Rated", value: "oldest" },
    { label: "Artist (A-Z)", value: "artist" },
    { label: "Album (A-Z)", value: "title" },
  ];

  return (
    <main className="min-h-screen bg-[#050507] text-neutral-100">
      <MySection className="pt-6 pb-24">
        <div className="flex flex-col gap-8 pb-8">
          <div>
            <h1 className="text-3xl font-light tracking-tight text-neutral-200">
              Rated Albums
            </h1>
            <p className="text-neutral-500 text-sm font-mono mt-2">
              Collection of fully and partially rated albums.
            </p>
          </div>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            {/* Filters - Left */}
            <div className="grid grid-cols-2 md:flex md:flex-wrap items-center gap-2 w-full md:w-auto">
              <DropdownFilter
                options={sortOptions}
                value={sortFilter}
                onChange={setSortFilter}
                className="w-full md:w-auto"
              />

              <DropdownFilter
                options={categoryOptions}
                value={categoryFilter}
                onChange={setCategoryFilter}
                className="w-full md:w-auto"
              />

              <DropdownFilter
                options={ratingOptions}
                value={ratingFilter}
                onChange={setRatingFilter}
                className="w-full md:w-auto"
              />

              <DropdownFilter
                options={statusOptions}
                value={statusFilter}
                onChange={setStatusFilter}
                className="w-full md:w-auto"
              />
            </div>

            {/* Search Bar - Right */}
            <div className="w-full md:w-64">
              <SearchInput
                value={searchQuery}
                onChange={setSearchQuery}
                onClear={() => setSearchQuery("")}
                placeholder="search albums..."
                onFocus={() => setIsSearchFocused(true)}
                onBlur={() => setIsSearchFocused(false)}
                isFocused={isSearchFocused}
                size="compact"
              />
            </div>
          </div>
        </div>

        {filteredAlbums.length === 0 ? (
          <div className="py-20 text-center text-neutral-600 font-mono text-sm">
            No albums found.
          </div>
        ) : (
          <AlbumGrid
            albums={filteredAlbums}
            onSelectAlbum={() => {}}
            layout="grid"
            gridCols={4}
          />
        )}
      </MySection>
    </main>
  );
}
