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
    <div className={`flex flex-col gap-3 text-sm ${className}`}>
      <div className="space-y-2">
        <div className="relative aspect-square w-[160px] overflow-visible">
          {data.image ? (
            <img
              src={data.image}
              alt={artistName}
              className="w-full h-full object-cover rounded-full bg-white"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-white rounded-xl">
              <span className="text-xl font-mono text-neutral-400">
                {artistName.slice(0, 2).toUpperCase()}
              </span>
            </div>
          )}
          <div className="absolute -right-0 bottom-0 rounded-full bg-white shadow-sm">
            <FavoriteButton
              itemId={artistId}
              itemType="artist"
              itemName={artistName}
              thumbnailUrl={data.image || undefined}
              size="lg"
            />
          </div>
        </div>

        <div>
          {/* <p className="mt-6 font-mono text-sm uppercase tracking-widest text-neutral-500">
            Artist
          </p> */}
          <h1 className="mt-6 text-2xl font-semibold text-neutral-950 tracking-tight leading-tight">
            {artistName}
          </h1>
        </div>
      </div>

      {data.genres && data.genres.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {data.genres.slice(0, 5).map((genre) => (
            <span
              key={genre}
              className="rounded-full bg-white px-2 py-1 text-xs text-neutral-600 uppercase tracking-widest"
            >
              {genre}
            </span>
          ))}
        </div>
      )}

    </div>
  );
}
