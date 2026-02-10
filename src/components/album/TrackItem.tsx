"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import {
  FaPlay,
  FaPause,
  FaGlobe,
  FaLock,
  FaPlus,
  FaMinus,
} from "react-icons/fa";
import { HiOutlineMicrophone } from "react-icons/hi2";
import { useRatingsContext as useRatings } from "@/context/RatingsContext";
import { usePlayer } from "@/context/PlayerContext";
import { formatTime, createSlug } from "@/lib/utils";
import ColorRating from "@/components/rating/ColorRating";
import Button from "@/components/ui/Button";
import FavoriteButton from "@/components/ui/FavoriteButton";
import AddToPlaylistButton from "@/components/ui/AddToPlaylistButton";
import { useLyrics } from "@/hooks/useLyrics";
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
}: TrackItemProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [lyricsFontSize, setLyricsFontSize] = useState(12);
  const { ratings, setRating } = useRatings();
  const { currentTrack, isPlaying, isLoading, playTrack } = usePlayer();
  const rating =
    forcedRating !== undefined ? forcedRating : ratings[track.id] || 0;
  const isCurrentTrack = currentTrack?.id === track.id;
  const isReadOnly = forcedRating !== undefined;

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
      className={`border-b border-[#1a1a1f] ${
        highlighted
          ? "animate-highlight-track bg-[#00f0ff]/5 ring-1 ring-inset ring-[#00f0ff]/20"
          : ""
      }`}
    >
      <div className="flex items-center justify-between py-3 group hover:bg-[#0a0a0d] px-4 transition-colors">
        <div className="flex items-center gap-4 min-w-0 flex-1">
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

          <span className="text-[10px] text-neutral-600 font-mono hidden sm:block w-5 shrink-0 text-right mr-4">
            {formatTime(track.length, "milliseconds")}
          </span>

          {/* Favorite Button */}
          <FavoriteButton
            itemId={track.id}
            itemType="track"
            itemName={track.title}
            artistName={artistName}
            size="sm"
            className="mr-2"
          />

          {/* Add to Playlist Button */}
          <AddToPlaylistButton
            trackId={track.id}
            trackName={track.title}
            artistName={artistName}
            albumName={albumContext.title}
            albumId={albumId}
            thumbnailUrl={albumImageUrl}
            durationMs={track.length}
            size="sm"
            className="mr-2"
          />

          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-neutral-300 group-hover:text-[#00f0ff] transition-colors truncate text-sm">
                {track.title}
              </span>
              {track.hasLyrics && (
                <Button
                  size="xxs"
                  variant={lyricsOpen ? "primary" : "muted"}
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleLyrics?.(track.id);
                  }}
                  iconLeft={<HiOutlineMicrophone size={10} />}
                  title={lyricsOpen ? "Hide lyrics" : "Show lyrics"}
                >
                  Lyrics
                </Button>
              )}
            </div>
            {track.artists && track.artists.length > 0 && (
              <span className="text-neutral-600 text-xs line-clamp-2 leading-relaxed mt-0.5">
                {track.artists
                  .filter((a) => a.id !== artistId)
                  .map((a, i, arr) => (
                    <span key={`${a.id}-${i}`}>
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
          </div>
        </div>
      </div>

      {/* Lyrics Accordion */}
      {lyricsOpen && (
        <div className="px-4 pb-4 pt-2 bg-[#07070a] border-t border-[#1a1a1f]/50">
          {lyricsLoading ? (
            <div className="flex items-center gap-2 py-3">
              <div className="w-3 h-3 border border-[#00f0ff]/40 border-t-[#00f0ff] rounded-full animate-spin" />
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
                className="text-neutral-400 leading-relaxed font-sans whitespace-pre-wrap max-h-80 overflow-y-auto scrollbar-thin scrollbar-thumb-neutral-800 scrollbar-track-transparent pr-2"
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
    </div>
  );
}
