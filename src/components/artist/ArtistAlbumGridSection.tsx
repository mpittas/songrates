"use client";

import { useEffect, useMemo, useState } from "react";
import Button from "@/components/ui/Button";
import AlbumCard from "@/components/album/AlbumCard";
import { useRatingsContext } from "@/context/RatingsContext";
import { cn } from "@/lib/utils";
import type { Album } from "@/types/music";

export default function ArtistAlbumGridSection({
  albums,
  initialCount = 12,
  ratingMode = "full",
  showOptionsMenu = true,
  columns = 3,
  showRemoveAllRatings = false,
  onAlbumFavoriteChange,
}: {
  albums: Album[];
  initialCount?: number;
  ratingMode?: "any" | "full";
  showOptionsMenu?: boolean;
  columns?: 3 | 4;
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
        className={cn(
          "grid grid-cols-2 gap-[22px]",
          columns === 4 ? "sm:grid-cols-4" : "sm:grid-cols-3",
        )}
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
        <div className="mt-4 flex justify-center pb-6">
          <Button
            variant="secondary"
            size="xs"
            onClick={() => setShowAll(!showAll)}
            className="w-full"
          >
            {showAll ? "Show less" : `Show all ${albums.length} releases`}
          </Button>
        </div>
      )}
    </div>
  );
}
