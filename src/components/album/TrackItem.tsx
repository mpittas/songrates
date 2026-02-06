"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { FaPlay, FaPause, FaGlobe, FaLock } from "react-icons/fa";
import { IoFlame } from "react-icons/io5";
import { useRatings } from "@/hooks/useRatings";
import { usePlayer } from "@/context/PlayerContext";
import { formatTime, createSlug } from "@/lib/utils";
import ColorRating from "@/components/rating/ColorRating";
import ListenCountBadge from "@/components/shared/ListenCountBadge";
import { TrackInfo, AlbumContext } from "@/types/music";

import OptimizedImage from "@/components/ui/OptimizedImage";

interface TrackItemProps {
  track: TrackInfo;
  artistName: string;
  artistId: string;
  albumId: string;
  albumImageUrl: string;
  albumContext: AlbumContext;
  publicRating?: number;
  publicCount?: number;
  forcedRating?: number;
  /** ListenBrainz total listen count */
  listenCount?: number;
  /** When true, scroll into view and pulse-highlight this track */
  highlighted?: boolean;
  /** Whether to show the album cover image for this track */
  showImage?: boolean;
}

export default function TrackItem({
  track,
  artistName,
  artistId,
  albumId,
  albumImageUrl,
  albumContext,
  publicRating,
  publicCount,
  forcedRating,
  listenCount,
  highlighted = false,
  showImage = false,
}: TrackItemProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const { ratings, setRating } = useRatings();
  const { currentTrack, isPlaying, isLoading, playTrack } = usePlayer();
  const rating =
    forcedRating !== undefined ? forcedRating : ratings[track.id] || 0;
  const isCurrentTrack = currentTrack?.id === track.id;
  const isReadOnly = forcedRating !== undefined;

  // Auto-scroll and highlight when this track is the search target
  useEffect(() => {
    if (highlighted && trackRef.current) {
      // Small delay to ensure DOM is rendered and album page has loaded
      const timer = setTimeout(() => {
        trackRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [highlighted]);

  return (
    <div
      ref={trackRef}
      className={`border-b border-[#1a1a1f] ${
        highlighted
          ? "animate-highlight-track bg-[#00f0ff]/5 ring-1 ring-inset ring-[#00f0ff]/20"
          : ""
      }`}
    >
      <div className="flex items-center justify-between py-3 group hover:bg-[#0a0a0d] px-4 transition-colors">
        <div className="flex items-center gap-4 min-w-0 flex-1">
          {showImage && (
            <div className="relative w-10 h-10 shrink-0 rounded-sm overflow-hidden bg-neutral-900 border border-white/5">
              <OptimizedImage
                src={albumImageUrl}
                alt={track.title}
                fill
                className="object-cover"
                fallbackSrc="/vinyl-placeholder.svg"
              />
            </div>
          )}
          <span className="text-neutral-600 font-mono text-xs w-2 shrink-0 text-left">
            {track.number}
          </span>

          <button
            onClick={() =>
              playTrack({
                id: track.id,
                title: track.title,
                artistName: artistName,
                artistId: artistId,
                albumId: albumId,
                albumImageUrl: albumImageUrl || "/vinyl-placeholder.svg",
                albumTitle: albumContext.title,
                releaseDate: albumContext.releaseDate,
                totalTracks: albumContext.totalTracks,
                artists: track.artists,
              })
            }
            className={`flex items-center justify-center w-6 h-6 border shrink-0 transition-all ${
              isCurrentTrack && isPlaying
                ? "bg-[#00f0ff] border-[#00f0ff] text-[#050507]"
                : "bg-[#0a0a0d] border-[#1a1a1f] text-neutral-500 hover:bg-[#00f0ff] hover:border-[#00f0ff] hover:text-[#050507]"
            }`}
            title="Play"
          >
            {isCurrentTrack && isLoading ? (
              <span className="animate-pulse text-[8px]">...</span>
            ) : isCurrentTrack && isPlaying ? (
              <FaPause size={8} />
            ) : (
              <FaPlay size={8} className="ml-0.5" />
            )}
          </button>

          <span className="text-[10px] text-neutral-600 font-mono hidden sm:block w-5 shrink-0 text-right">
            {formatTime(track.length, "milliseconds")}
          </span>

          <div className="flex flex-col min-w-0">
            <span className="text-neutral-300 group-hover:text-[#00f0ff] transition-colors truncate text-sm">
              {track.title}
            </span>
            {track.artists && track.artists.length > 0 && (
              <span className="text-neutral-600 text-xs line-clamp-2 leading-relaxed mt-0.5">
                {track.artists
                  .filter((a) => a.id !== artistId)
                  .map((a, i, arr) => (
                    <span key={a.id}>
                      {i === 0 ? "feat. " : ""}
                      <Link
                        href={`/artist/${createSlug(a.name, a.id)}`}
                        className="hover:text-[#00f0ff] hover:underline transition-colors"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {a.name}
                      </Link>
                      {i < arr.length - 1 ? ", " : ""}
                    </span>
                  ))}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* ListenBrainz Total Plays */}
          <ListenCountBadge count={listenCount || 0} className="border-none" />

          {/* Public Rating Display */}
          {publicRating && (
            <div
              className="hidden md:flex items-center gap-1.5 opacity-60 hover:opacity-100 transition-opacity"
              title={`Public: ${publicRating} (${publicCount}) users`}
            >
              <span className="text-[11px] text-neutral-50 font-medium">
                {publicRating.toFixed(2)}
                <span className="text-neutral-500 font-light ml-1">/ 10</span>
              </span>

              <FaGlobe size={10} className="text-neutral-500" />
            </div>
          )}

          {/* User Rating Digit (Read Only Mode) */}
          {isReadOnly && rating > 0 && (
            <div className="flex items-center gap-1.5 ml-2 border-l border-neutral-800 pl-3">
              <span
                className="text-[11px] font-bold"
                style={{ color: "#00f0ff" }}
              >
                {rating}
              </span>
              <span className="text-[9px] text-neutral-600 font-mono uppercase">
                User
              </span>
            </div>
          )}

          <div
            className={`flex items-center gap-2 ${isReadOnly ? "opacity-60" : ""}`}
          >
            {isReadOnly && <FaLock size={10} className="text-neutral-600" />}
            <div className={isReadOnly ? "pointer-events-none" : ""}>
              <ColorRating
                rating={rating}
                onRate={(val) =>
                  !isReadOnly && setRating(track.id, val, albumContext)
                }
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
