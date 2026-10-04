"use client";

import { cn, createSlug } from "@/lib/utils";
import { MediaCardArt } from "@/components/ui/MediaCard";
import { useState } from "react";
import InstantLink from "@/components/ui/InstantLink";
import { useRatingsContext } from "@/context/RatingsContext";
import AlbumRatingBadge from "@/components/rating/AlbumRatingBadge";
import AlbumCardDropdown from "@/components/album/AlbumCardDropdown";
import { isFullyRatedAlbum } from "@/lib/albumPageStats";
import { Album } from "@/types/music";

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
    isFull = isFullyRatedAlbum(ratedCount, totalTracks);
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
          shouldShowPersonalScore && personalScore !== null
            ? personalScore
            : "—"
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
  const [optionsOpen, setOptionsOpen] = useState(false);

  const slug = createSlug(album.title, album.id);
  const year = album.releaseDate?.split("-")[0];

  if (layout === "list") {
    return (
      <InstantLink
        href={`/album/${slug}`}
        className="group flex items-center gap-3 px-3 py-2.5 transition-colors hover:bg-ink/[0.025] sm:px-4"
      >
        <MediaCardArt
          imageUrl={album.artworkUrl}
          alt={album.title}
          radius="md"
          lift={false}
          className="size-12 shrink-0"
        />
        <div className="flex min-w-0 flex-1 items-center justify-between gap-4">
          <div className="min-w-0">
            <h3 className="truncate text-[14px] font-medium text-ink">
              {album.title}
            </h3>
            <p className="truncate text-[13px] text-ink-2">
              {album.artistName || "Unknown Artist"}
            </p>
          </div>
          <span className="shrink-0 text-xs text-ink-3 tabular-nums">
            {year || "—"}
          </span>
        </div>
      </InstantLink>
    );
  }

  return (
    <div className="group relative block min-w-0">
      <InstantLink
        href={`/album/${slug}`}
        className="block rounded-xl outline-offset-4"
      >
        <MediaCardArt
          imageUrl={album.artworkUrl}
          alt={album.title}
          priority={isPriority}
          radius={isCompact ? "lg" : "xl"}
        >
          {showRating && <RatingBadge album={album} mode={ratingMode} />}
        </MediaCardArt>

        <div className={cn("min-w-0", isCompact ? "mt-2" : "mt-3")}>
          <h3
            className={cn(
              "truncate font-medium tracking-[-0.01em] text-ink",
              isCompact ? "text-[13px] leading-5" : "text-[14px] leading-5",
            )}
          >
            {album.title}
          </h3>
          <p
            className={cn(
              "truncate text-ink-2",
              isCompact ? "text-xs leading-5" : "text-[13px] leading-5",
            )}
          >
            {[album.artistName, year].filter(Boolean).join(" · ") || "—"}
          </p>
        </div>
      </InstantLink>

      {showOptionsMenu && (
        <div
          className={cn(
            "absolute z-30 transition-opacity duration-200",
            optionsOpen
              ? "opacity-100"
              : "pointer-fine:opacity-0 pointer-fine:group-hover:opacity-100 pointer-fine:focus-within:opacity-100",
            isCompact ? "top-1.5 right-1.5" : "top-2 right-2",
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
  );
}
