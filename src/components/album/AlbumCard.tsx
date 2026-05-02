"use client";

import { createSlug } from "@/lib/utils";
import OptimizedImage from "@/components/ui/OptimizedImage";
import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import { FaEllipsisV } from "react-icons/fa";
import { useRatingsContext } from "@/context/RatingsContext";
import AlbumRatingBadge from "@/components/rating/AlbumRatingBadge";
import { Album } from "@/types/music";
import Button from "@/components/ui/Button";
import { usePrefetchAlbum } from "@/hooks/useAlbumInfo";

export interface AlbumCardProps {
  album: Album;
  isPriority?: boolean;
  layout?: "grid" | "list";
  showRating?: boolean;
  ratingMode?: "any" | "full";
  showOptionsMenu?: boolean;
}

function AlbumOptionsMenu({ albumId }: { albumId: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const { removeAlbumRating, albumRatings } = useRatingsContext();
  const menuRef = useRef<HTMLDivElement>(null);

  const albumData = albumRatings[albumId];
  const hasAnyRating = albumData && albumData.ratedTrackIds.length > 0;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setShowConfirm(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative inline-block" ref={menuRef}>
      <Button
        variant="ghost"
        className="w-8 h-8 p-0 bg-white/90 hover:bg-white text-neutral-700 border border-[#d7d7d7] backdrop-blur-sm"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsOpen(!isOpen);
          setShowConfirm(false);
        }}
        title="Options"
      >
        <FaEllipsisV size={12} />
      </Button>

      {isOpen && (
        <div className="absolute top-full right-0 mt-1 w-40 bg-white border border-[#d7d7d7] shadow-xl z-30 flex flex-col py-1 animate-in fade-in zoom-in-95 duration-100 origin-top-right rounded-md overflow-hidden">
          {hasAnyRating ? (
            !showConfirm ? (
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setShowConfirm(true);
                }}
                className="text-left px-3 py-2 text-xs font-mono text-neutral-700 hover:bg-[#f5f5f5] hover:text-neutral-900 transition-colors flex items-center gap-2 w-full"
              >
                Remove Rating
              </button>
            ) : (
              <div className="px-3 py-2 bg-red-500/5">
                <p className="text-[10px] text-red-400 mb-2 font-mono uppercase tracking-wider">
                  Are you sure?
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      removeAlbumRating(albumId);
                      setIsOpen(false);
                    }}
                    className="flex-1 bg-red-500/20 hover:bg-red-500/30 text-red-300 text-[10px] py-1 rounded-sm border border-red-500/20 font-mono transition-colors"
                  >
                    Yes
                  </button>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setShowConfirm(false);
                    }}
                    className="flex-1 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 text-[10px] py-1 rounded-sm border border-neutral-300 font-mono transition-colors"
                  >
                    No
                  </button>
                </div>
              </div>
            )
          ) : (
            <div className="px-3 py-2 text-xs text-neutral-600 italic font-mono text-center">
              no_options
            </div>
          )}
        </div>
      )}
    </div>
  );
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
    // MB Rating fallback if no local rating
    personalScore = album.rating;
    isFull = true;
  }

  // If we have either personal or public rating, show badge
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
  showRating = true,
  ratingMode = "any",
  showOptionsMenu = true,
}: AlbumCardProps) {
  const imageUrl = album.artworkUrl || "/vinyl-placeholder.svg";
  const [imageError, setImageError] = useState(false);
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
      <Link
        href={`/album/${slug}`}
        onMouseEnter={handleMouseEnter}
        className="block relative mb-3"
      >
        <div className="aspect-square bg-[#efefef] overflow-hidden relative border border-[#e1e1e1] group-hover:border-[#c9c9c9] transition-colors rounded-md">
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
            <div className="w-full h-full flex items-center justify-center p-10 opacity-20 group-hover:opacity-30 transition-opacity">
              <img
                src="/vinyl-placeholder.svg"
                alt=""
                className="w-full h-full object-contain"
              />
            </div>
          )}

          {showOptionsMenu && (
            <div className="absolute top-2 right-2 flex gap-2 z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              <AlbumOptionsMenu albumId={album.id} />
            </div>
          )}

          {showRating && <RatingBadge album={album} mode={ratingMode} />}
        </div>
      </Link>

      <div className="flex justify-between items-start gap-2">
        <Link
          href={`/album/${slug}`}
          onMouseEnter={handleMouseEnter}
          className="flex-1 min-w-0 block"
        >
          <h3 className="text-neutral-900 text-sm font-medium truncate group-hover:text-black transition-colors leading-tight mb-0.5">
            {album.title}
          </h3>
          <div className="flex flex-col gap-0 text-xs text-neutral-500">
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
