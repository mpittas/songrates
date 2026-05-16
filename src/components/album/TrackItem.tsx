"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import {
  FaPlay,
  FaPause,
  FaGlobe,
  FaLock,
  FaPlus,
  FaMinus,
  FaTimes,
} from "react-icons/fa";
import { HiOutlineMicrophone, HiEllipsisVertical } from "react-icons/hi2";
import { useRatingsContext as useRatings } from "@/context/RatingsContext";
import { usePlayerCore } from "@/context/PlayerContext";
import { createSlug } from "@/lib/utils";
import ColorRating from "@/components/rating/ColorRating";
import Button from "@/components/ui/Button";
import FavoriteButton from "@/components/ui/FavoriteButton";
import DropdownMenu from "@/components/ui/DropdownMenu";
import PlaylistSelectorModal from "@/components/ui/PlaylistSelectorModal";
import { lyricsQueryOptions, useLyrics } from "@/hooks/useLyrics";
import { TrackInfo, AlbumContext } from "@/types/music";

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
  /** When true, scroll into view and pulse-highlight this track */
  highlighted?: boolean;
  lyricsOpen?: boolean;
  onToggleLyrics?: (trackId: string) => void;
  queue?: import("@/types/music").Track[];
  onRemove?: () => void;
  isRemoving?: boolean;
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
  highlighted = false,
  lyricsOpen = false,
  onToggleLyrics,
  queue,
  onRemove,
  isRemoving,
}: TrackItemProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [lyricsFontSize, setLyricsFontSize] = useState(12);
  const [showPlaylistModal, setShowPlaylistModal] = useState(false);
  const { ratings, setRating } = useRatings();
  const { currentTrack, isPlaying, isLoading, playTrack } = usePlayerCore();
  const rating =
    forcedRating !== undefined ? forcedRating : ratings[track.id] || 0;
  const isCurrentTrack = currentTrack?.id === track.id;
  const isReadOnly = forcedRating !== undefined;

  const queryClient = useQueryClient();
  const prefetchLyrics = useCallback(() => {
    queryClient.prefetchQuery(
      lyricsQueryOptions(track.title, artistName, track.length),
    );
  }, [queryClient, track.title, artistName, track.length]);

  // Only fetch lyrics when user opens the panel
  const { data: lyricsData, isLoading: lyricsLoading } = useLyrics(
    track.title,
    artistName,
    track.length,
    lyricsOpen,
  );

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
      className={`border-b border-[#e7e7e7] ${
        highlighted
          ? "animate-highlight-track bg-[#f4f4f4] ring-1 ring-inset ring-[#cfcfcf]"
          : ""
      }`}
    >
      <div className="flex items-center justify-between py-3 group hover:bg-[#f7f7f7] px-4 transition-colors">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <span className="text-neutral-600 font-mono text-xs w-2 shrink-0 text-left">
            {track.number}
          </span>

          <button
            onClick={() =>
              playTrack(
                {
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
                },
                queue,
              )
            }
            className={`flex items-center justify-center w-6 h-6 border shrink-0 transition-all ${
              isCurrentTrack && isPlaying
                ? "bg-[#1f1f1f] border-[#1f1f1f] text-white"
                : "bg-white border-[#d7d7d7] text-neutral-500 hover:bg-[#f0f0f0] hover:border-[#c7c7c7] hover:text-neutral-900"
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

          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-neutral-900 group-hover:text-black transition-colors truncate text-sm">
                {track.title}
              </span>
            </div>
            {(() => {
              const features = (track.artists || []).filter(
                (a) => a.id !== artistId,
              );
              if (features.length === 0) return null;

              return (
                <div className="flex flex-wrap gap-x-1 mt-0.5">
                  <span className="text-neutral-500 text-[11px] font-mono uppercase tracking-tight">
                    feat.
                  </span>
                  {features.map((a, i, arr) => (
                    <span key={a.id} className="text-[11px]">
                      <Link
                        href={`/artist/${createSlug(a.name, a.id)}`}
                        className="text-neutral-500 hover:text-neutral-900 transition-colors"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {a.name}
                      </Link>
                      {i < arr.length - 1 && (
                        <span className="text-neutral-600 ml-0.5">,</span>
                      )}
                    </span>
                  ))}
                </div>
              );
            })()}
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Public Rating Display */}
          {publicRating && (
            <div
              className="hidden md:flex items-center gap-1.5 opacity-60 hover:opacity-100 transition-opacity"
              title={`Public: ${publicRating} (${publicCount}) users`}
            >
              <span className="text-[11px] text-neutral-900 font-medium">
                {publicRating.toFixed(2)}
                <span className="text-neutral-500 font-light ml-1">/ 10</span>
              </span>

              <FaGlobe size={10} className="text-neutral-500" />
            </div>
          )}

          <div className="flex items-center gap-0">
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

              {/* User Rating Digit (Read Only Mode) - Now on right side of progress bar */}
              {isReadOnly && rating > 0 && (
                <div className="flex items-center gap-1.5 ml-2 border-l border-[#d7d7d7] pl-3">
                  <span
                    className="text-[11px] font-bold"
                    style={{ color: "#1f1f1f" }}
                  >
                    {rating}
                  </span>
                  <span className="text-[9px] text-neutral-600 font-mono uppercase">
                    User
                  </span>
                </div>
              )}
            </div>

            <div className="ml-2 shrink-0 flex items-center justify-center">
              <DropdownMenu
                trigger={
                  <button
                    className="w-6 h-6 flex items-center justify-center rounded-full text-neutral-500 hover:text-neutral-900 hover:bg-neutral-200 transition-colors"
                    title="More options"
                  >
                    <HiEllipsisVertical size={20} />
                  </button>
                }
                align="right"
                className="relative"
              >
                <div className="w-48 py-1">
                  {/* Favorite */}
                  <FavoriteButton
                    itemId={track.id}
                    itemType="track"
                    itemName={track.title}
                    artistName={artistName}
                    thumbnailUrl={albumImageUrl}
                    albumId={albumId}
                    albumName={albumContext.title}
                    durationMs={
                      track.length ? Number(track.length) : undefined
                    }
                    artistId={track.artists?.[0]?.id || artistId}
                    artists={track.artists}
                    variant="menu-item"
                  />

                  {/* Add to Playlist */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowPlaylistModal(true);
                    }}
                    data-menu-close
                    className="w-full text-left flex items-center gap-3 px-3 py-2 text-xs font-mono text-neutral-600 hover:text-neutral-900 hover:bg-[#f5f5f5] transition-colors"
                  >
                    <div className="w-4 flex justify-center">
                      <FaPlus size={12} />
                    </div>
                    <span>Add to Playlist</span>
                  </button>

                  {/* Lyrics */}
                  {track.hasLyrics && (
                    <button
                      type="button"
                      onMouseEnter={prefetchLyrics}
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleLyrics?.(track.id);
                      }}
                      data-menu-close
                      className="w-full text-left flex items-center gap-3 px-3 py-2 text-xs font-mono text-neutral-600 hover:text-neutral-900 hover:bg-[#f5f5f5] transition-colors"
                    >
                      <div className="w-4 flex justify-center">
                        <HiOutlineMicrophone size={12} />
                      </div>
                      <span>{lyricsOpen ? "Hide Lyrics" : "Show Lyrics"}</span>
                    </button>
                  )}

                  {/* Remove from Playlist (if applicable) */}
                  {onRemove && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onRemove();
                      }}
                      data-menu-close
                      disabled={isRemoving}
                      className="w-full text-left flex items-center gap-3 px-3 py-2 text-xs font-mono text-red-600 hover:text-red-700 hover:bg-[#f5f5f5] transition-colors"
                    >
                      <div className="w-4 flex justify-center">
                        <FaTimes size={12} />
                      </div>
                      <span>{isRemoving ? "Removing..." : "Remove"}</span>
                    </button>
                  )}
                </div>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </div>

      {/* Lyrics Accordion */}
      {lyricsOpen && (
        <div className="px-4 pb-4 pt-2 bg-[#fafafa] border-t border-[#e7e7e7]">
          {lyricsLoading ? (
            <div className="flex items-center gap-2 py-3">
              <div className="w-3 h-3 border border-neutral-400 border-t-neutral-700 rounded-full animate-spin" />
              <span className="text-neutral-500 text-xs font-mono">
                Loading lyrics...
              </span>
            </div>
          ) : lyricsData?.lyrics ? (
            <>
              <div className="flex items-center justify-end gap-1 mb-2">
                <Button
                  size="xxs"
                  variant="ghost"
                  onClick={() => setLyricsFontSize((s) => Math.max(8, s - 1))}
                  title="Decrease font size"
                >
                  <FaMinus size={7} />
                </Button>
                <span className="text-[9px] text-neutral-600 font-mono w-5 text-center">
                  {lyricsFontSize}
                </span>
                <Button
                  size="xxs"
                  variant="ghost"
                  onClick={() => setLyricsFontSize((s) => Math.min(24, s + 1))}
                  title="Increase font size"
                >
                  <FaPlus size={7} />
                </Button>
              </div>
              <pre
                className="text-neutral-700 leading-relaxed font-sans whitespace-pre-wrap max-h-80 overflow-y-auto scrollbar-thin scrollbar-thumb-neutral-300 scrollbar-track-transparent pr-2"
                style={{ fontSize: `${lyricsFontSize}px` }}
              >
                {lyricsData.lyrics}
              </pre>
            </>
          ) : (
            <p className="text-neutral-600 text-xs font-mono py-2">
              No lyrics found
            </p>
          )}
        </div>
      )}

      {/* Playlist Selector Modal */}
      {showPlaylistModal && (
        <PlaylistSelectorModal
          trackId={track.id}
          trackName={track.title}
          artistName={artistName}
          albumName={albumContext.title}
          albumId={albumId}
          thumbnailUrl={albumImageUrl}
          durationMs={track.length}
          onClose={() => setShowPlaylistModal(false)}
        />
      )}
    </div>
  );
}
