"use client";

import { ArtistInfo as ArtistInfoType } from "@/types/music";

interface Props {
  artistName: string;
  data: ArtistInfoType;
  className?: string;
}

export default function ArtistInfo({
  artistName,
  data,
  className = "",
}: Props) {
  return (
    <div
      className={`flex flex-col items-center gap-3 text-sm pt-6 ${className}`}
    >
      <div className="relative aspect-square w-[140px] overflow-hidden rounded-full bg-white">
        {data.image ? (
          <img
            src={data.image}
            alt={artistName}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <span className="text-xl font-mono text-neutral-400">
              {artistName.slice(0, 2).toUpperCase()}
            </span>
          </div>
        )}
      </div>

      <div className="mt-3 text-2xl text-center font-semibold text-neutral-950">
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
