"use client";

import { ArtistInfo as ArtistInfoType } from "@/types/music";
import { FaGlobe } from "react-icons/fa";
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
    <div className={`flex flex-col gap-4 lg:gap-6 text-sm ${className}`}>
      <div className="space-y-3 lg:space-y-4">
        <div className="relative w-full aspect-square max-w-[80px] lg:max-w-[100px]">
          {data.image ? (
            <img
              src={data.image}
              alt={artistName}
              className="w-full h-full object-cover rounded-full bg-[#efefef]"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-[#efefef] rounded-full">
              <span className="text-xl font-mono text-neutral-400">
                {artistName.slice(0, 2).toUpperCase()}
              </span>
            </div>
          )}
        </div>

        <div>
          <h1 className="text-xl text-neutral-900 tracking-tight leading-tight mb-1">
            {artistName}
          </h1>
        </div>

        {/* Favorite Button */}
        <div>
          <FavoriteButton
            itemId={artistId}
            itemType="artist"
            itemName={artistName}
            thumbnailUrl={data.image || undefined}
            size="md"
          />
        </div>
      </div>

      {data.description && (
        <div className="text-neutral-500 text-xs leading-relaxed line-clamp-6 hover:line-clamp-none transition-all duration-300">
          {data.description}
        </div>
      )}

      {data.genres && data.genres.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {data.genres.slice(0, 5).map((genre) => (
            <span
              key={genre}
              className="px-2 py-0.5 bg-[#f2f2f2] text-[9px] text-neutral-600 hover:text-neutral-900 transition-colors uppercase tracking-widest"
            >
              {genre}
            </span>
          ))}
        </div>
      )}

      {data.url && (
        <div className="flex flex-col gap-3 pt-4 border-t border-[#e7e7e7] font-mono text-[10px] uppercase tracking-widest">
          <a
            href={data.url}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 text-neutral-500 hover:text-neutral-900 transition-colors group"
          >
            <FaGlobe
              size={12}
              className="group-hover:scale-110 transition-transform opacity-70 group-hover:opacity-100"
            />
            <span>Apple Music</span>
          </a>
        </div>
      )}
    </div>
  );
}
