"use client";

import { ArtistInfo as ArtistInfoType } from "@/types/music";
import FavoriteButton from "@/components/ui/FavoriteButton";

interface Props {
  artistId: string;
  artistName: string;
  data: ArtistInfoType;
  className?: string;
}

export default function ArtistInfo({
  artistId,
  artistName,
  data,
  className = "",
}: Props) {
  return (
    <div
      className={`flex flex-col items-center gap-3 text-sm pt-6 ${className}`}
    >
      <div className="relative aspect-square w-[140px] overflow-visible">
        {data.image ? (
          <img
            src={data.image}
            alt={artistName}
            className="w-full h-full object-cover rounded-full bg-white"
          />
        ) : (
          <div className="w-full flex items-center justify-center bg-white rounded-xl">
            <span className="text-xl font-mono text-neutral-400">
              {artistName.slice(0, 2).toUpperCase()}
            </span>
          </div>
        )}
        <div className="absolute -bottom-4 right-1/2 translate-x-1/2 rounded-full bg-white">
          <FavoriteButton
            itemId={artistId}
            itemType="artist"
            itemName={artistName}
            thumbnailUrl={data.image || undefined}
            size="lg"
          />
        </div>
      </div>

      <div className="mt-3 text-2xl font-semibold text-neutral-950">
        {artistName}
      </div>

      {data.genres && data.genres.length > 0 && (
        <div className="flex flex-wrap justify-center gap-1">
          {data.genres.slice(0, 5).map((genre) => (
            <span
              key={genre}
              className="rounded-full bg-neutral-900 px-2 py-1 text-xs text-white uppercase font-bold"
            >
              {genre}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
