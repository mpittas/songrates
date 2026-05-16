"use client";

import { cn, createSlug } from "@/lib/utils";
import OptimizedImage from "@/components/ui/OptimizedImage";
import { useState, useRef, useCallback } from "react";
import Link from "next/link";
import { useRatingsContext } from "@/context/RatingsContext";
import AlbumRatingBadge from "@/components/rating/AlbumRatingBadge";
import AlbumCardDropdown from "@/components/album/AlbumCardDropdown";
import { Album } from "@/types/music";
import { usePrefetchAlbum } from "@/hooks/useAlbumInfo";

export interface AlbumCardProps {
  album: Album;
  isPriority?: boolean;
  layout?: "grid" | "list";
  size?: "default" | "compact";
  showRating?: boolean;
  ratingMode?: "any" | "full";
  showOptionsMenu?: boolean;
  showRemoveAllRatings?: boolean;
  onFavoriteChange?: (isFavorite: boolean) => void;
}

function RatingBadge({
  album,
  mode = "any",
}: {
  album: Album;
  mode?: "any" | "full";
}) {
  const { albumRatings, ratings, publicAlbumRatings } = useRatingsContext();
  const localAlbumData = albumRatings[album.id];
  const publicData = publicAlbumRatings[album.id];

  let personalScore: number | string | null = null;
  let ratedCount = 0;
  let totalTracks = 0;
  let isFull = false;

  if (localAlbumData && localAlbumData.ratedTrackIds.length > 0) {
    ratedCount = localAlbumData.ratedTrackIds.length;
    totalTracks = localAlbumData.totalTracks || 0;

    let sum = 0;
    let count = 0;
    localAlbumData.ratedTrackIds.forEach((tId) => {
      if (ratings[tId]) {
        sum += ratings[tId];
        count++;
      }
    });

    if (count > 0) {
      personalScore = (sum / count).toFixed(1);
    }
    isFull = totalTracks > 0 && ratedCount >= totalTracks;
  } else if (album.rating) {
    personalScore = album.rating;
    isFull = true;
  }

  const shouldShowPersonalScore =
    personalScore !== null && (mode === "any" || isFull);
  const shouldShowPublicScore = mode === "any" && publicData;

  if (shouldShowPersonalScore || shouldShowPublicScore) {
    return (
      <AlbumRatingBadge
        score={
          shouldShowPersonalScore && personalScore !== null ? personalScore : "—"
        }
        ratedCount={ratedCount}
        totalTracks={totalTracks}
        isFull={isFull}
        publicRating={
          shouldShowPublicScore ? publicData?.averageRating : undefined
        }
        publicCount={
          shouldShowPublicScore ? publicData?.ratingCount : undefined
        }
      />
    );
  }

  return null;
}

export default function AlbumCard({
  album,
  isPriority = false,
  layout = "grid",
  size = "default",
  showRating = true,
  ratingMode = "any",
  showOptionsMenu = true,
  showRemoveAllRatings = false,
  onFavoriteChange,
}: AlbumCardProps) {
  const isCompact = size === "compact";
  const imageUrl = album.artworkUrl || "/vinyl-placeholder.svg";
  const [imageError, setImageError] = useState(false);
  const [optionsOpen, setOptionsOpen] = useState(false);
  const prefetchAlbum = usePrefetchAlbum();
  const prefetchedRef = useRef(false);

  const slug = createSlug(album.title, album.id);

  const handleMouseEnter = useCallback(() => {
    if (prefetchedRef.current) return;
    prefetchedRef.current = true;
    prefetchAlbum(slug);
  }, [slug, prefetchAlbum]);

  if (layout === "list") {
    return (
      <Link
        href={`/album/${slug}`}
        onMouseEnter={handleMouseEnter}
        className="flex items-center gap-4 p-2 hover:bg-[#f7f7f7] border-b border-[#ececec] last:border-0 group transition-colors"
      >
        <div className="relative w-12 h-12 shrink-0 overflow-hidden bg-[#efefef] rounded-sm">
          {!imageError ? (
            <OptimizedImage
              src={imageUrl}
              alt={album.title}
              fill
              className="object-cover"
              onError={() => setImageError(true)}
              fallbackText="·"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center p-2 opacity-40">
              <img
                src="/vinyl-placeholder.svg"
                alt=""
                className="w-full h-full object-contain"
              />
            </div>
          )}
        </div>
        <div className="flex bg-transparent min-w-0 flex-1 justify-between items-center gap-4">
          <div>
            <h3 className="text-neutral-900 truncate group-hover:text-black transition-colors font-medium">
              {album.title}
            </h3>
            <p className="text-neutral-500 text-sm truncate">
              {album.artistName || "Unknown Artist"}
            </p>
          </div>
          <span className="text-neutral-600 font-mono text-xs shrink-0">
            {album.releaseDate?.split("-")[0] || "—"}
          </span>
        </div>
      </Link>
    );
  }

  return (
    <div className="group block">
      <div className={cn("relative", isCompact ? "mb-2" : "mb-3")}>
        <Link
          href={`/album/${slug}`}
          onMouseEnter={handleMouseEnter}
          className={cn(
            "block aspect-square bg-[#efefef] overflow-hidden relative border border-[#e1e1e1] group-hover:border-[#c9c9c9] transition-colors",
            isCompact ? "rounded-sm" : "rounded-md",
          )}
        >
          {!imageError ? (
            <OptimizedImage
              src={imageUrl}
              alt={album.title}
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
                isCompact ? "p-6" : "p-10",
              )}
            >
              <img
                src="/vinyl-placeholder.svg"
                alt=""
                className="w-full h-full object-contain"
              />
            </div>
          )}

          {showRating && <RatingBadge album={album} mode={ratingMode} />}
        </Link>

        {showOptionsMenu && (
          <div
            className={cn(
              "absolute z-30 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity duration-200",
              optionsOpen && "opacity-100",
              isCompact ? "top-1 right-1" : "top-2 right-2",
            )}
          >
            <AlbumCardDropdown
              album={album}
              compact={isCompact}
              showRemoveAllRatings={showRemoveAllRatings}
              onFavoriteChange={onFavoriteChange}
              onOpenChange={setOptionsOpen}
            />
          </div>
        )}
      </div>

      <div className="flex justify-between items-start gap-2">
        <Link
          href={`/album/${slug}`}
          onMouseEnter={handleMouseEnter}
          className="flex-1 min-w-0 block"
        >
          <h3
            className={cn(
              "text-neutral-900 font-medium truncate group-hover:text-black transition-colors leading-tight",
              isCompact ? "text-xs mb-0" : "text-sm mb-0.5",
            )}
          >
            {album.title}
          </h3>
          <div
            className={cn(
              "flex flex-col gap-0 text-neutral-500",
              isCompact ? "text-[11px]" : "text-xs",
            )}
          >
            <p className="truncate group-hover:text-neutral-700 transition-colors">
              {album.artistName ? `${album.artistName} • ` : ""}
              {album.releaseDate?.split("-")[0] || "—"}
            </p>
          </div>
        </Link>
      </div>
    </div>
  );
}
