"use client";

import { createSlug } from "@/lib/utils";

import OptimizedImage from "@/components/OptimizedImage";
import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { FaWikipediaW, FaEllipsisV } from "react-icons/fa";
import { useRatingsContext } from "@/context/RatingsContext";
import AlbumRatingBadge from "@/components/AlbumRatingBadge";

import { Album } from "@/types/music";

interface AlbumCardProps {
  album: Album;
  onSelect: (id: string) => void;
  isPriority?: boolean;
  layout?: "grid" | "list";
}

function AlbumCard({
  album,
  onSelect,
  isPriority = false,
  layout = "grid",
}: AlbumCardProps) {
  const imageUrl = `https://coverartarchive.org/release-group/${album.id}/front-250`;
  const [imageError, setImageError] = useState(false);

  if (layout === "list") {
    return (
      <Link
        href={`/album/${createSlug(album.title, album.id)}`}
        className="flex items-center gap-4 p-1.5 hover:bg-[#0a0a0d] border-b border-[#1a1a1f] last:border-0 group transition-colors"
      >
        <div className="relative w-8 h-8 shrink-0 border border-[#1a1a1f] overflow-hidden bg-[#0a0a0d]">
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
        <div className="flex bg-transparent min-w-0 flex-1 justify-between items-baseline gap-4">
          <h3 className="text-neutral-300 text-sm truncate group-hover:text-[#00f0ff] transition-colors">
            {album.title}
          </h3>
          <span className="text-neutral-600 font-mono text-[10px] shrink-0">
            {album.releaseDate?.split("-")[0] || "—"}
          </span>
        </div>
      </Link>
    );
  }

  return (
    <Link
      href={`/album/${createSlug(album.title, album.id)}`}
      className="group block"
    >
      <div className="relative mb-2">
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

          {album.wikipediaUrl && (
            <div
              onClick={(e) => {
                e.preventDefault();
                window.open(album.wikipediaUrl, "_blank");
              }}
              className="absolute top-2 right-2 bg-[#050507]/90 text-neutral-400 p-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10 border border-[#1a1a1f] hover:text-[#00f0ff] hover:border-[#00f0ff]/50 cursor-pointer"
              title="Wikipedia"
            >
              <FaWikipediaW size={10} />
            </div>
          )}

          {/* Rating Badge */}
          {(() => {
            const { albumRatings, ratings } = useRatingsContext();
            const localAlbumData = albumRatings[album.id];

            // If we have local data with rated tracks, use it for stats
            if (localAlbumData && localAlbumData.ratedTrackIds.length > 0) {
              const ratedCount = localAlbumData.ratedTrackIds.length;
              const totalTracks = localAlbumData.totalTracks || 0;

              // Calculate Average
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

            // Fallback for when album might be passed with a static rating prop but no context data
            if (album.rating) {
              return (
                <AlbumRatingBadge
                  score={album.rating}
                  ratedCount={0}
                  totalTracks={0}
                  isFull={true} // Default to full style if only simple rating provided
                />
              );
            }
            return null;
          })()}
        </div>

        {/* Options Menu - Outside overflow-hidden */}
        <div
          onClick={(e) => e.preventDefault()}
          className="absolute top-2 left-2 z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
        >
          <AlbumOptionsMenu albumId={album.id} />
        </div>
      </div>
      <h3 className="text-neutral-300 text-xs truncate group-hover:text-[#00f0ff] transition-colors">
        {album.title}
      </h3>
      <div className="flex items-center gap-2 mt-0.5 text-xs">
        {album.artistName && (
          <p className="text-neutral-500 truncate max-w-[70%] group-hover:text-neutral-400 transition-colors">
            {album.artistName}
          </p>
        )}
        <p className="text-neutral-500">
          {album.releaseDate?.split("-")[0] || "—"}
        </p>
      </div>
    </Link>
  );
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
        setShowConfirm(false); // Reset confirm state on close
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsOpen(!isOpen);
          setShowConfirm(false);
        }}
        className="bg-[#050507]/90 text-neutral-400 p-1.5 border border-[#1a1a1f] hover:text-[#00f0ff] hover:border-[#00f0ff]/50 cursor-pointer rounded-full backdrop-blur-sm"
        title="Options"
      >
        <FaEllipsisV size={10} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-40 bg-[#0a0a0d] border border-[#1a1a1f] shadow-xl z-30 flex flex-col py-1 animate-in fade-in zoom-in-95 duration-100 origin-top-left rounded-md overflow-hidden">
          {hasAnyRating ? (
            !showConfirm ? (
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setShowConfirm(true);
                }}
                className="text-left px-3 py-2 text-[10px] font-mono text-neutral-300 hover:bg-red-500/10 hover:text-red-400 transition-colors flex items-center gap-2 w-full"
              >
                Remove Rating
              </button>
            ) : (
              <div className="px-3 py-2 bg-red-500/5">
                <p className="text-[9px] text-red-400 mb-2 font-mono">
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
                    className="flex-1 bg-red-500/20 hover:bg-red-500/30 text-red-300 text-[9px] py-1 rounded border border-red-500/20 font-mono transition-colors"
                  >
                    Yes
                  </button>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setShowConfirm(false);
                    }}
                    className="flex-1 bg-neutral-800 hover:bg-neutral-700 text-neutral-400 text-[9px] py-1 rounded border border-neutral-700 font-mono transition-colors"
                  >
                    No
                  </button>
                </div>
              </div>
            )
          ) : (
            <div className="px-3 py-2 text-[10px] text-neutral-500 italic font-mono text-center">
              No options
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function AlbumGrid({
  albums,
  onSelectAlbum,
  title,
  priorityCount = 0,
  layout = "grid",
}: {
  albums: Album[];
  onSelectAlbum: (id: string) => void;
  title?: string;
  priorityCount?: number;
  layout?: "grid" | "list";
}) {
  if (albums.length === 0) return null;

  return (
    <div>
      {title && (
        <h2 className="font-mono text-xs text-neutral-500 mb-4 tracking-wide">
          {title.toLowerCase()}_
          <span className="text-neutral-700 ml-1">{albums.length}</span>
        </h2>
      )}

      {layout === "grid" ? (
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-3 md:grid-cols-4">
          {albums.map((album, index) => (
            <AlbumCard
              key={album.id}
              album={album}
              onSelect={onSelectAlbum}
              isPriority={index < priorityCount}
              layout="grid"
            />
          ))}
        </div>
      ) : (
        <div className="border-t border-[#1a1a1f]">
          {albums.map((album) => (
            <AlbumCard
              key={album.id}
              album={album}
              onSelect={onSelectAlbum}
              layout="list"
            />
          ))}
        </div>
      )}
    </div>
  );
}
