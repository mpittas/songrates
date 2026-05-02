"use client";

import { ArtistInfo as ArtistInfoType } from "@/types/music";
import FavoriteButton from "@/components/ui/FavoriteButton";
import Button from "@/components/ui/Button";

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
        <div className="relative aspect-square w-[86px] overflow-visible">
          {data.image ? (
            <img
              src={data.image}
              alt={artistName}
              className="w-full h-full object-cover rounded-xl bg-white"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-white rounded-xl">
              <span className="text-xl font-mono text-neutral-400">
                {artistName.slice(0, 2).toUpperCase()}
              </span>
            </div>
          )}
          <div className="absolute -right-2 bottom-2 rounded-full bg-white shadow-sm">
            <FavoriteButton
              itemId={artistId}
              itemType="artist"
              itemName={artistName}
              thumbnailUrl={data.image || undefined}
              size="sm"
            />
          </div>
        </div>

        <div>
          <p className="font-mono text-[9px] uppercase tracking-widest text-neutral-500">
            Artist
          </p>
          <h1 className="text-lg font-semibold text-neutral-950 tracking-tight leading-tight">
            {artistName}
          </h1>
        </div>
      </div>

      {data.description && (
        <div className="text-neutral-500 text-[11px] leading-relaxed line-clamp-8 hover:line-clamp-none transition-all duration-300">
          {data.description}
        </div>
      )}

      {data.genres && data.genres.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {data.genres.slice(0, 5).map((genre) => (
            <span
              key={genre}
              className="rounded-full bg-white px-2 py-1 text-[8px] text-neutral-600 uppercase tracking-widest"
            >
              {genre}
            </span>
          ))}
        </div>
      )}

      {data.url && (
        <Button
          href={data.url}
          isExternal
          variant="border"
          size="sm"
          className="w-full justify-between rounded-md px-3 py-2 text-[9px] uppercase tracking-widest"
          iconRight={<span className="text-xs leading-none">+</span>}
        >
          Similar Artists
        </Button>
      )}
      {!data.url && (
        <Button
          variant="border"
          size="sm"
          className="w-full justify-between rounded-md px-3 py-2 text-[9px] uppercase tracking-widest"
          iconRight={<span className="text-xs leading-none">+</span>}
          disabled
        >
          Similar Artists
        </Button>
      )}
    </div>
  );
}
