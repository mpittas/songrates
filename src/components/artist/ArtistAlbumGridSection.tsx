"use client";

import { useState } from "react";
import Button from "@/components/ui/Button";
import AlbumCard from "@/components/album/AlbumCard";
import type { Album } from "@/types/music";

export default function ArtistAlbumGridSection({
  albums,
  initialCount = 12,
}: {
  albums: Album[];
  initialCount?: number;
}) {
  const [showAll, setShowAll] = useState(false);
  const visible = showAll ? albums : albums.slice(0, initialCount);
  const hasMore = albums.length > initialCount;

  return (
    <div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {visible.map((album) => (
          <AlbumCard
            key={album.id}
            album={album}
            ratingMode="full"
            showOptionsMenu={false}
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
