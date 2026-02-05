"use client";

import { createSlug } from "@/lib/utils";
import OptimizedImage from "@/components/OptimizedImage";
import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { FaWikipediaW, FaEllipsisV } from "react-icons/fa";
import { useRatingsContext } from "@/context/RatingsContext";
import AlbumRatingBadge from "@/components/AlbumRatingBadge";
import { Album } from "@/types/music";
import Button from "@/components/ui/Button";

interface AlbumCardProps {
  album: Album;
  onSelect: (id: string) => void;
  isPriority?: boolean;
  layout?: "grid" | "list";
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
        size="xs"
        className="rounded-full w-8 h-8 p-0 bg-black/60 hover:bg-black/80 text-white border border-white/10 backdrop-blur-sm"
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
        <div className="absolute top-full right-0 mt-1 w-40 bg-neutral-900 border border-[#1a1a1f] shadow-xl z-30 flex flex-col py-1 animate-in fade-in zoom-in-95 duration-100 origin-top-right rounded-md overflow-hidden">
          {hasAnyRating ? (
            !showConfirm ? (
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setShowConfirm(true);
                }}
                className="text-left px-3 py-2 text-xs font-mono text-neutral-300 hover:bg-red-500/10 hover:text-red-400 transition-colors flex items-center gap-2 w-full"
              >
                Remove Rating
              </button>
            ) : (
              <div className="px-3 py-2 bg-red-500/5">
                <p className="text-[10px] text-red-400 mb-2 font-mono">
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
                    className="flex-1 bg-red-500/20 hover:bg-red-500/30 text-red-300 text-[10px] py-1 rounded border border-red-500/20 font-mono transition-colors"
                  >
                    Yes
                  </button>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setShowConfirm(false);
                    }}
                    className="flex-1 bg-neutral-800 hover:bg-neutral-700 text-neutral-400 text-[10px] py-1 rounded border border-neutral-700 font-mono transition-colors"
                  >
                    No
                  </button>
                </div>
              </div>
            )
          ) : (
            <div className="px-3 py-2 text-xs text-neutral-500 italic font-mono text-center">
              No options
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function AlbumCard({
  album,
  onSelect,
  isPriority = false,
  layout = "grid",
}: AlbumCardProps) {
  const imageUrl = `https://coverartarchive.org/release-group/${album.id}/front-250`;
  const [imageError, setImageError] = useState(false);

  if (layout === "list") {
    // List layout implementation remains the same
    return (
      <Link
        href={`/album/${createSlug(album.title, album.id)}`}
        className="flex items-center gap-4 p-2 hover:bg-[#0a0a0d] border-b border-[#1a1a1f] last:border-0 group transition-colors"
      >
        <div className="relative w-12 h-12 shrink-0 border border-[#1a1a1f] overflow-hidden bg-[#0a0a0d]">
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
            <div className="w-full h-full flex items-center justify-center bg-[#0a0a0d] p-2 opacity-40">
              <img
                src="/vinyl-placeholder.svg"
                alt="No art"
                className="w-full h-full object-contain invert"
              />
            </div>
          )}
        </div>
        <div className="flex bg-transparent min-w-0 flex-1 justify-between items-center gap-4">
          <div>
            <h3 className="text-neutral-200 text-base truncate group-hover:text-[#00f0ff] transition-colors font-medium">
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
        href={`/album/${createSlug(album.title, album.id)}`}
        className="block relative mb-3"
      >
        <div className="aspect-square bg-[#0a0a0d] overflow-hidden relative border border-[#1a1a1f] group-hover:border-[#00f0ff]/30 transition-colors">
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
            <div className="w-full h-full flex items-center justify-center bg-[#0a0a0d] p-10 opacity-20 group-hover:opacity-30 transition-opacity">
              <img
                src="/vinyl-placeholder.svg"
                alt="No art"
                className="w-full h-full object-contain invert"
              />
            </div>
          )}

          <div className="absolute top-2 right-2 flex gap-2 z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            {album.wikipediaUrl && (
              <Button
                variant="ghost"
                size="xs"
                className="rounded-full w-8 h-8 p-0 bg-black/60 hover:bg-black/80 text-white border border-white/10 backdrop-blur-sm"
                onClick={(e) => {
                  e.preventDefault();
                  window.open(album.wikipediaUrl, "_blank");
                }}
                title="Wikipedia"
              >
                <FaWikipediaW size={12} />
              </Button>
            )}
            <AlbumOptionsMenu albumId={album.id} />
          </div>

          {/* Rating Badge */}
          {(() => {
            const { albumRatings, ratings } = useRatingsContext();
            const localAlbumData = albumRatings[album.id];

            if (localAlbumData && localAlbumData.ratedTrackIds.length > 0) {
              const ratedCount = localAlbumData.ratedTrackIds.length;
              const totalTracks = localAlbumData.totalTracks || 0;

              let sum = 0;
              let count = 0;
              localAlbumData.ratedTrackIds.forEach((tId) => {
                if (ratings[tId]) {
                  sum += ratings[tId];
                  count++;
                }
              });
              const avg = count > 0 ? (sum / count).toFixed(1) : "—";
              const isFull = totalTracks > 0 && ratedCount >= totalTracks;

              return (
                <AlbumRatingBadge
                  score={avg}
                  ratedCount={ratedCount}
                  totalTracks={totalTracks}
                  isFull={isFull}
                />
              );
            }

            if (album.rating) {
              return (
                <AlbumRatingBadge
                  score={album.rating}
                  ratedCount={0}
                  totalTracks={0}
                  isFull={true}
                />
              );
            }
            return null;
          })()}
        </div>
      </Link>

      <div className="flex justify-between items-start gap-2">
        <Link
          href={`/album/${createSlug(album.title, album.id)}`}
          className="flex-1 min-w-0 block"
        >
          <h3 className="text-neutral-200 text-sm font-medium truncate group-hover:text-[#00f0ff] transition-colors leading-tight mb-0.5">
            {album.title}
          </h3>
          <div className="flex flex-col gap-0 text-xs">
            {album.artistName ? (
              <p className="text-neutral-500 truncate group-hover:text-neutral-300 transition-colors">
                {album.artistName} • {album.releaseDate?.split("-")[0] || "—"}
              </p>
            ) : (
              <p className="text-neutral-500 truncate group-hover:text-neutral-300 transition-colors">
                {album.releaseDate?.split("-")[0] || "—"}
              </p>
            )}
          </div>
        </Link>
      </div>
    </div>
  );
}
