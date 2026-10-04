"use client";

import { cn, createSlug } from "@/lib/utils";
import { MediaCardArt } from "@/components/ui/MediaCard";
import { useState } from "react";
import InstantLink from "@/components/ui/InstantLink";
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
  const [optionsOpen, setOptionsOpen] = useState(false);

  const slug = createSlug(artist.name, artist.id);
  const primaryGenre = artist.genres?.[0];

  return (
    <div className="group relative block min-w-0 text-center">
      <InstantLink
        href={`/artist/${slug}`}
        className="block rounded-full outline-offset-4"
      >
        <MediaCardArt
          imageUrl={artist.artworkUrl}
          alt={artist.name}
          shape="circle"
          priority={isPriority}
          className={cn("mx-auto", isCompact ? "w-24" : "w-full max-w-[180px]")}
        />
      </InstantLink>

      <InstantLink
        href={`/artist/${slug}`}
        className={cn("block min-w-0", isCompact ? "mt-2" : "mt-3")}
      >
        <h3
          className={cn(
            "truncate font-medium tracking-[-0.01em] text-ink",
            isCompact ? "text-xs" : "text-[14px] leading-5",
          )}
        >
          {artist.name}
        </h3>
        <p
          className={cn(
            "truncate text-ink-2",
            isCompact ? "text-[11px]" : "text-[13px] leading-5",
          )}
        >
          {primaryGenre || "Artist"}
        </p>
      </InstantLink>

      {showOptionsMenu && (
        <div
          className={cn(
            "absolute z-30 transition-opacity duration-200",
            optionsOpen
              ? "opacity-100"
              : "pointer-fine:opacity-0 pointer-fine:group-hover:opacity-100 pointer-fine:focus-within:opacity-100",
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
  );
}
