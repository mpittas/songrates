"use client";

import Button from "@/components/ui/Button";
import FavoriteButton from "@/components/ui/FavoriteButton";
import { FaArrowLeft, FaPlay } from "react-icons/fa";
import type { ArtistInfo as ArtistInfoType, Track } from "@/types/music";

export interface ArtistPageHeaderProps {
  artistId: string;
  artistName: string;
  artistInfo: ArtistInfoType;
  topSongsQueue: Track[];
  onPlayTopSongs: () => void;
}

export default function ArtistPageHeader({
  artistId,
  artistName,
  artistInfo,
  topSongsQueue,
  onPlayTopSongs,
}: ArtistPageHeaderProps) {
  return (
    <div className="relative z-10 mb-8 flex flex-wrap items-center justify-between gap-3">
      <Button
        href="/"
        variant="secondary"
        size="xs"
        iconLeft={<FaArrowLeft size={14} className="mr-2" />}
      >
        BACK TO HOME
      </Button>
      <div className="flex flex-wrap items-center justify-end gap-3">
        <FavoriteButton
          itemId={artistId}
          itemType="artist"
          itemName={artistName}
          thumbnailUrl={artistInfo.image || undefined}
          variant="secondary"
          buttonSize="xs"
        />
        {topSongsQueue.length > 0 && (
          <Button
            variant="secondary"
            size="xs"
            iconLeft={<FaPlay size={12} className="mr-2" />}
            onClick={onPlayTopSongs}
          >
            PLAY TOP SONGS
          </Button>
        )}
      </div>
    </div>
  );
}
