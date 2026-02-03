"use client";

import { useRatings } from "@/hooks/useRatings";
import { useMemo, useState } from "react";
import CollapsibleSection from "@/components/CollapsibleSection";
import MySection from "@/components/MySection";
import { Album } from "@/types/music";

type FilterType = "all" | "full" | "partial";

export default function RatedAlbumsPage() {
  const { albumRatings, getAlbumRating } = useRatings();
  const [filter, setFilter] = useState<FilterType>("all");

  const albums = useMemo(() => {
    const allAlbums = Object.values(albumRatings).filter(
      (a) => a.ratedTrackIds.length > 0,
    );

    const mapped: (Album & {
      status: "full" | "partial";
      addedAt?: number; // We don't track this yet, so sorting might be arbitrary
    })[] = allAlbums.map((a) => {
      const isFull =
        a.ratedTrackIds.length >= a.totalTracks && a.totalTracks > 0;
      const rating = getAlbumRating(a.id); // Returns null if partial

      return {
        id: a.id,
        title: a.title,
        artistName: a.artistName,
        releaseDate: a.releaseDate,
        rating: rating,
        status: isFull ? "full" : "partial",
        // We lack cover art URL in RatedAlbumData!
        // We need to fetch it or store it.
        // Wait, AlbumCard uses `https://coverartarchive.org/release-group/${album.id}/front-250`
        // So we just need the ID. Which we have.
      };
    });

    return mapped.sort((a, b) => {
      // Sort by Artist then Title
      const artistCompare = (a.artistName || "").localeCompare(
        b.artistName || "",
      );
      if (artistCompare !== 0) return artistCompare;
      return a.title.localeCompare(b.title);
    });
  }, [albumRatings, getAlbumRating]);

  const filteredAlbums = useMemo(() => {
    if (filter === "all") return albums;
    return albums.filter((a) => a.status === filter);
  }, [albums, filter]);

  return (
    <main className="min-h-screen bg-[#050507] text-neutral-100">
      <MySection className="pt-24 pb-24">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12 border-b border-[#1a1a1f] pb-6">
          <div>
            <h1 className="text-3xl font-light tracking-tight text-neutral-200">
              Rated Albums
            </h1>
            <p className="text-neutral-500 text-sm font-mono mt-2">
              Collection of fully and partially rated albums.
            </p>
          </div>

          <div className="flex items-center gap-1 bg-[#0a0a0d] p-1 border border-[#1a1a1f] rounded-full">
            {(["all", "full", "partial"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-1.5 rounded-full text-xs font-mono transition-all ${
                  filter === f
                    ? "bg-[#00f0ff] text-[#050507] font-bold"
                    : "text-neutral-500 hover:text-neutral-300"
                }`}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {filteredAlbums.length === 0 ? (
          <div className="py-20 text-center text-neutral-600 font-mono text-sm">
            No albums found with {filter !== "all" ? `${filter} ` : ""}ratings.
          </div>
        ) : (
          <CollapsibleSection
            title={`${filter === "all" ? "Details" : filter}_albums`}
            releases={filteredAlbums}
            onSelectAlbum={() => {}}
            layout="grid"
            defaultOpen={true}
            tooltipText={`List of albums with ${filter === "all" ? "any" : filter} ratings.`}
          />
        )}
      </MySection>
    </main>
  );
}
