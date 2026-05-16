"use client";

import { cn, createSlug } from "@/lib/utils";
import OptimizedImage from "@/components/ui/OptimizedImage";
import { useState } from "react";
import Link from "next/link";
import ArtistCardDropdown from "@/components/artist/ArtistCardDropdown";

export interface ArtistCardArtist {
  id: string;
  name: string;
  artworkUrl?: string;
  genres?: string[];
}

export interface ArtistCardProps {
  artist: ArtistCardArtist;
  isPriority?: boolean;
  size?: "default" | "compact";
  showOptionsMenu?: boolean;
  onFavoriteChange?: (isFavorite: boolean) => void;
}

export default function ArtistCard({
  artist,
  isPriority = false,
  size = "default",
  showOptionsMenu = true,
  onFavoriteChange,
}: ArtistCardProps) {
  const isCompact = size === "compact";
  const imageUrl = artist.artworkUrl || "/vinyl-placeholder.svg";
  const [imageError, setImageError] = useState(false);
  const [optionsOpen, setOptionsOpen] = useState(false);

  const slug = createSlug(artist.name, artist.id);
  const primaryGenre = artist.genres?.[0];

  return (
    <div className="group block text-center">
      <div className={cn("relative mx-auto", isCompact ? "mb-2 w-24" : "mb-3 w-full max-w-[180px]")}>
        <Link
          href={`/artist/${slug}`}
          className={cn(
            "block aspect-square bg-[#efefef] overflow-hidden relative border border-[#e1e1e1] group-hover:border-[#c9c9c9] transition-colors rounded-full",
          )}
        >
          {!imageError ? (
            <OptimizedImage
              src={imageUrl}
              alt={artist.name}
              fill
              className="object-cover transition-all duration-300"
              onError={() => setImageError(true)}
              priority={isPriority}
              fallbackText="·"
            />
          ) : (
            <div
              className={cn(
                "w-full h-full flex items-center justify-center opacity-20 group-hover:opacity-30 transition-opacity",
                isCompact ? "p-4" : "p-8",
              )}
            >
              <span className="text-lg font-mono text-neutral-500">
                {artist.name.slice(0, 2).toUpperCase()}
              </span>
            </div>
          )}
        </Link>

        {showOptionsMenu && (
          <div
            className={cn(
              "absolute z-30 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity duration-200",
              optionsOpen && "opacity-100",
              isCompact ? "top-0 right-0" : "top-1 right-1",
            )}
          >
            <ArtistCardDropdown
              artist={artist}
              compact={isCompact}
              onFavoriteChange={onFavoriteChange}
              onOpenChange={setOptionsOpen}
            />
          </div>
        )}
      </div>

      <Link href={`/artist/${slug}`} className="block min-w-0">
        <h3
          className={cn(
            "text-neutral-900 font-medium truncate group-hover:text-black transition-colors leading-tight",
            isCompact ? "text-xs" : "text-sm",
          )}
        >
          {artist.name}
        </h3>
        {primaryGenre && (
          <p
            className={cn(
              "text-neutral-500 truncate group-hover:text-neutral-700 transition-colors mt-0.5",
              isCompact ? "text-[11px]" : "text-xs",
            )}
          >
            {primaryGenre}
          </p>
        )}
      </Link>
    </div>
  );
}
