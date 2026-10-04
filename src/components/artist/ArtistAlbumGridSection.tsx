"use client";

import { useEffect, useMemo, useState } from "react";
import { LuChevronDown } from "react-icons/lu";
import Button from "@/components/ui/Button";
import AlbumCard from "@/components/album/AlbumCard";
import { useRatingsContext } from "@/context/RatingsContext";
import { cn } from "@/lib/utils";
import type { Album } from "@/types/music";

const GRID_COLUMNS = {
  3: "grid-cols-2 sm:grid-cols-3",
  4: "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4",
  6: "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6",
} as const;

export default function ArtistAlbumGridSection({
  albums,
  initialCount = 12,
  ratingMode = "full",
  showOptionsMenu = true,
  columns = 4,
  showRemoveAllRatings = false,
  onAlbumFavoriteChange,
}: {
  albums: Album[];
  initialCount?: number;
  ratingMode?: "any" | "full";
  showOptionsMenu?: boolean;
  columns?: keyof typeof GRID_COLUMNS;
  showRemoveAllRatings?: boolean;
  onAlbumFavoriteChange?: (albumId: string, isFavorite: boolean) => void;
}) {
  const [showAll, setShowAll] = useState(false);
  const visible = useMemo(
    () => (showAll ? albums : albums.slice(0, initialCount)),
    [albums, initialCount, showAll],
  );
  const hasMore = albums.length > initialCount;
  const { ensurePublicAlbumRatings } = useRatingsContext();
  const visibleAlbumIds = useMemo(
    () => visible.map((album) => album.id),
    [visible],
  );

  useEffect(() => {
    void ensurePublicAlbumRatings(visibleAlbumIds);
  }, [ensurePublicAlbumRatings, visibleAlbumIds]);

  return (
    <div>
      <div
        className={cn("grid gap-x-4 gap-y-8 md:gap-x-5", GRID_COLUMNS[columns])}
      >
        {visible.map((album) => (
          <AlbumCard
            key={album.id}
            album={album}
            ratingMode={ratingMode}
            showOptionsMenu={showOptionsMenu}
            showRemoveAllRatings={showRemoveAllRatings}
            onFavoriteChange={(liked) =>
              onAlbumFavoriteChange?.(album.id, liked)
            }
          />
        ))}
      </div>
      {hasMore && (
        <div className="mt-8 flex justify-center">
          <Button
            variant="border"
            size="sm"
            onClick={() => setShowAll(!showAll)}
            iconRight={
              <LuChevronDown
                size={15}
                className={cn(
                  "transition-transform duration-200",
                  showAll && "rotate-180",
                )}
              />
            }
          >
            {showAll ? "Show less" : `Show all ${albums.length}`}
          </Button>
        </div>
      )}
    </div>
  );
}
