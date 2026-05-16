"use client";

import { useState } from "react";
import Button from "@/components/ui/Button";
import ArtistCard, { type ArtistCardArtist } from "@/components/artist/ArtistCard";

export default function ArtistGridSection({
  artists,
  initialCount = 12,
  showOptionsMenu = true,
  onArtistFavoriteChange,
}: {
  artists: ArtistCardArtist[];
  initialCount?: number;
  showOptionsMenu?: boolean;
  onArtistFavoriteChange?: (artistId: string, isFavorite: boolean) => void;
}) {
  const [showAll, setShowAll] = useState(false);
  const visible = showAll ? artists : artists.slice(0, initialCount);
  const hasMore = artists.length > initialCount;

  return (
    <div>
      <div className="grid grid-cols-2 gap-[22px] sm:grid-cols-3 md:grid-cols-4">
        {visible.map((artist) => (
          <ArtistCard
            key={artist.id}
            artist={artist}
            showOptionsMenu={showOptionsMenu}
            onFavoriteChange={(liked) =>
              onArtistFavoriteChange?.(artist.id, liked)
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
            {showAll ? "Show less" : `Show all ${artists.length} artists`}
          </Button>
        </div>
      )}
    </div>
  );
}
