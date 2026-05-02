"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { FaPlay, FaPause, FaPlus, FaMinus } from "react-icons/fa6";
import { BsThreeDotsVertical } from "react-icons/bs";
import { IoDiscOutline } from "react-icons/io5";
import { HiOutlineMicrophone } from "react-icons/hi2";
import { usePlayer } from "@/context/PlayerContext";
import { useRatingsContext } from "@/context/RatingsContext";
import { useLyrics } from "@/hooks/useLyrics";
import { Track, AlbumContext } from "@/types/music";
import { createSlug } from "@/lib/utils";
import PlaylistSelectorModal from "@/components/ui/PlaylistSelectorModal";
import Button from "@/components/ui/Button";

interface SongRowProps {
  index: number;
  title: string;
  artist: string;
  album: string;
  duration: string;
  artworkUrl?: string | null;
  rating?: number | null;
  track?: Track;
  artistId?: string;
  albumId?: string;
  albumContext?: AlbumContext;
  onPlay?: () => void;
  onRate?: (rating: number) => void;
  onAddToPlaylist?: () => void;
  onShare?: () => void;
  onGoToAlbum?: () => void;
  onGoToArtist?: () => void;
}

export default function SongRow({
  index,
  title,
  artist,
  album,
  duration,
  artworkUrl,
  rating,
  track,
  artistId,
  albumId,
  albumContext,
  onPlay,
  onRate,
  onAddToPlaylist,
  onShare,
  onGoToAlbum,
  onGoToArtist,
}: SongRowProps) {
  const [hovered, setHovered] = useState(false);
  const [showRatingPopover, setShowRatingPopover] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showPlaylistModal, setShowPlaylistModal] = useState(false);
  const [lyricsFontSize, setLyricsFontSize] = useState(18);
  const ratingRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const {
    currentTrack,
    isPlaying: isPlayerPlaying,
    isLoading,
    playTrack,
    currentLyricsTrackId,
    setCurrentLyricsTrackId,
  } = usePlayer();
  const isCurrentTrack = currentTrack?.id === track?.id;

  const { ratings, setRating } = useRatingsContext();
  const trackId = track?.id;
  const lyricsOpen = currentLyricsTrackId === trackId;
  const contextRating = trackId ? (ratings[trackId] ?? 0) : 0;
  const displayRating = rating ?? contextRating;

  const effectiveArtistId = track?.artistId ?? artistId;
  const effectiveAlbumId = track?.albumId ?? albumId;

  const { data: lyricsData, isLoading: lyricsLoading } = useLyrics(
    title,
    artist,
    track?.length,
    lyricsOpen,
  );

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ratingRef.current && !ratingRef.current.contains(e.target as Node)) {
        setShowRatingPopover(false);
      }
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const ratingColors: Record<number, string> = {
    1: "bg-red-500",
    2: "bg-red-400",
    3: "bg-orange-400",
    4: "bg-orange-300",
    5: "bg-yellow-400",
    6: "bg-yellow-300",
    7: "bg-lime-400",
    8: "bg-green-400",
    9: "bg-emerald-400",
    10: "bg-emerald-500",
  };

  const ratingBg =
    displayRating && displayRating > 0
      ? ratingColors[displayRating]
      : "bg-neutral-200";

  return (
    <div
      className="flex flex-col bg-white rounded-lg border border-neutral-100 hover:border-neutral-100 hover:bg-neutral-100 transition-colors group"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => {
        setHovered(false);
        setShowRatingPopover(false);
      }}
    >
      <div className="flex items-center gap-3 px-3 py-2.5 min-w-0">
        {/* Left Section */}
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {/* Track Number / Play Icon */}
          <div className="w-8 flex-shrink-0 flex items-center justify-center">
            {hovered || isCurrentTrack ? (
              <button
                onClick={() => {
                  if (track) {
                    playTrack(track);
                  } else if (onPlay) {
                    onPlay();
                  }
                }}
                className="w-8 h-8 flex items-center justify-center rounded-full text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 transition-all"
                aria-label={
                  isCurrentTrack && isPlayerPlaying ? "Pause" : "Play"
                }
              >
                {isCurrentTrack && isLoading ? (
                  <span className="animate-pulse text-[10px]">...</span>
                ) : isCurrentTrack && isPlayerPlaying ? (
                  <FaPause size={12} />
                ) : (
                  <FaPlay size={12} className="ml-0.5" />
                )}
              </button>
            ) : (
              <span className="text-sm text-neutral-400 font-mono w-8 text-center">
                {index}
              </span>
            )}
          </div>

          {/* Album Art */}
          <div className="w-10 h-10 rounded-md bg-neutral-200 flex-shrink-0 flex items-center justify-center overflow-hidden">
            {artworkUrl ? (
              <img
                src={artworkUrl}
                alt={album}
                className="w-full h-full object-cover"
              />
            ) : (
              <IoDiscOutline className="text-neutral-400" size={20} />
            )}
          </div>

          {/* Song Info */}
          <div className="flex flex-col min-w-0">
            {effectiveAlbumId ? (
              <Link
                href={`/album/${effectiveAlbumId}`}
                className="text-sm font-semibold text-neutral-900 truncate hover:underline"
              >
                {title}
              </Link>
            ) : (
              <span className="text-sm font-semibold text-neutral-900 truncate">
                {title}
              </span>
            )}
            <div className="flex items-center gap-1 text-xs text-neutral-500 min-w-0">
              <span className="truncate min-w-0">
                {track?.artists && track.artists.length > 0 ? (
                  track.artists.map((a, i, arr) => (
                    <span key={a.id ?? `${a.name}-${i}`}>
                      {a.id ? (
                        <Link
                          href={`/artist/${createSlug(a.name, a.id)}`}
                          className="hover:underline hover:text-neutral-700"
                        >
                          {a.name}
                        </Link>
                      ) : (
                        <span>{a.name}</span>
                      )}
                      {i < arr.length - 1 && (
                        <span className="text-neutral-400">, </span>
                      )}
                    </span>
                  ))
                ) : effectiveArtistId ? (
                  <Link
                    href={`/artist/${createSlug(artist, effectiveArtistId)}`}
                    className="hover:underline hover:text-neutral-700"
                  >
                    {artist}
                  </Link>
                ) : (
                  <span>{artist}</span>
                )}
              </span>
              <span className="text-neutral-300">/</span>
              <IoDiscOutline
                size={10}
                className="text-neutral-400 flex-shrink-0"
              />
              {effectiveAlbumId ? (
                <Link
                  href={`/album/${effectiveAlbumId}`}
                  className="truncate hover:underline hover:text-neutral-700"
                >
                  {album}
                </Link>
              ) : (
                <span className="truncate">{album}</span>
              )}
            </div>
          </div>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-3 flex-shrink-0">
          {/* Duration */}
          <span className="text-xs text-neutral-500 font-mono">{duration}</span>

          {/* Rating Circle */}
          <div className="relative" ref={ratingRef}>
            <button
              onClick={() => setShowRatingPopover((s) => !s)}
              className={`w-8 h-8 rounded-full ${ratingBg} flex items-center justify-center text-xs font-semibold transition-all hover:scale-105 ${
                displayRating && displayRating > 0
                  ? "text-white"
                  : "text-neutral-500"
              }`}
              aria-label="Rate song"
            >
              {displayRating && displayRating > 0 ? displayRating : "−"}
            </button>

            {/* Rating Popover */}
            {showRatingPopover && (
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-white border border-neutral-200 rounded-lg shadow-xl p-2 z-50 w-[200px]">
                <div className="text-xs text-neutral-500 mb-2 px-1">
                  Rate this track
                </div>
                <div className="grid grid-cols-5 gap-1">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                    <button
                      key={n}
                      onClick={() => {
                        if (trackId) {
                          setRating(trackId, n, albumContext);
                        }
                        onRate?.(n);
                        setShowRatingPopover(false);
                      }}
                      className={`w-7 h-7 rounded-full text-xs font-semibold transition-all hover:scale-110 ${
                        displayRating === n
                          ? `${ratingColors[n]} text-white`
                          : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
                      }`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Three Dots Menu */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setShowDropdown((s) => !s)}
              className="p-1.5 rounded-md text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition-colors"
              aria-label="More options"
            >
              <BsThreeDotsVertical size={14} />
            </button>

            {/* Dropdown */}
            {showDropdown && (
              <div className="absolute right-0 top-full mt-1 bg-white border border-neutral-200 rounded-lg shadow-xl py-1 z-50 w-48">
                {/* Add to Playlist */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowPlaylistModal(true);
                    setShowDropdown(false);
                  }}
                  className="w-full text-left flex items-center gap-3 px-3 py-2 text-xs font-mono text-neutral-600 hover:text-neutral-900 hover:bg-[#f5f5f5] transition-colors"
                >
                  <div className="w-4 flex justify-center">
                    <FaPlus size={12} />
                  </div>
                  <span>Add to Playlist</span>
                </button>

                {/* Show Lyrics */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setCurrentLyricsTrackId(
                      lyricsOpen ? null : trackId || null,
                    );
                    setShowDropdown(false);
                  }}
                  className="w-full text-left flex items-center gap-3 px-3 py-2 text-xs font-mono text-neutral-600 hover:text-neutral-900 hover:bg-[#f5f5f5] transition-colors"
                >
                  <div className="w-4 flex justify-center">
                    <HiOutlineMicrophone size={12} />
                  </div>
                  <span>{lyricsOpen ? "Hide Lyrics" : "Show Lyrics"}</span>
                </button>

                <div className="border-t border-neutral-100 my-1" />

                {onGoToAlbum && (
                  <button
                    onClick={() => {
                      onGoToAlbum();
                      setShowDropdown(false);
                    }}
                    className="w-full text-left flex items-center gap-3 px-3 py-2 text-xs font-mono text-neutral-600 hover:text-neutral-900 hover:bg-[#f5f5f5] transition-colors"
                  >
                    <div className="w-4 flex justify-center" />
                    <span>Go to Album</span>
                  </button>
                )}
                {onGoToArtist && (
                  <button
                    onClick={() => {
                      onGoToArtist();
                      setShowDropdown(false);
                    }}
                    className="w-full text-left flex items-center gap-3 px-3 py-2 text-xs font-mono text-neutral-600 hover:text-neutral-900 hover:bg-[#f5f5f5] transition-colors"
                  >
                    <div className="w-4 flex justify-center" />
                    <span>Go to Artist</span>
                  </button>
                )}
                {onShare && (
                  <button
                    onClick={() => {
                      onShare();
                      setShowDropdown(false);
                    }}
                    className="w-full text-left flex items-center gap-3 px-3 py-2 text-xs font-mono text-neutral-600 hover:text-neutral-900 hover:bg-[#f5f5f5] transition-colors"
                  >
                    <div className="w-4 flex justify-center" />
                    <span>Share</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Lyrics Accordion */}
      {lyricsOpen && (
        <div className="px-4 pb-4 pt-3 bg-neutral-50 border-t border-neutral-100 mt-2 rounded-b-lg">
          {/* Controls Row */}
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-neutral-200/50">
            <div className="flex items-center gap-2">
              <HiOutlineMicrophone size={14} className="text-neutral-500" />
              <span className="text-xs font-bold uppercase tracking-wider text-neutral-500 font-mono">
                Lyrics
              </span>
            </div>

            <div className="flex items-center gap-4">
              {/* Font Size Controls */}
              <div className="flex items-center gap-2 bg-neutral-200/50 rounded-lg p-0.5">
                <button
                  onClick={() => setLyricsFontSize((s) => Math.max(8, s - 2))}
                  className="flex items-center justify-center w-6 h-6 rounded-md hover:bg-white hover:shadow-sm text-neutral-600 transition-all"
                  title="Decrease font size"
                >
                  <FaMinus size={10} />
                </button>
                <span className="text-[10px] font-bold text-neutral-600 font-mono w-7 text-center">
                  {lyricsFontSize}px
                </span>
                <button
                  onClick={() => setLyricsFontSize((s) => Math.min(32, s + 2))}
                  className="flex items-center justify-center w-6 h-6 rounded-md hover:bg-white hover:shadow-sm text-neutral-600 transition-all"
                  title="Increase font size"
                >
                  <FaPlus size={10} />
                </button>
              </div>

              <div className="w-px h-4 bg-neutral-300" />

              <button
                onClick={() => setCurrentLyricsTrackId(null)}
                className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 hover:text-red-500 transition-colors font-mono"
              >
                Close
              </button>
            </div>
          </div>

          {lyricsLoading ? (
            <div className="flex items-center gap-2 py-4 justify-center">
              <div className="w-3 h-3 border-2 border-neutral-300 border-t-neutral-600 rounded-full animate-spin" />
              <span className="text-neutral-500 text-xs font-mono italic">
                Fetching words...
              </span>
            </div>
          ) : lyricsData?.lyrics ? (
            <pre
              className="text-neutral-700 leading-relaxed font-sans whitespace-pre-wrap max-h-80 overflow-y-auto scrollbar-thin scrollbar-thumb-neutral-300 scrollbar-track-transparent pr-2"
              style={{ fontSize: `${lyricsFontSize}px` }}
            >
              {lyricsData.lyrics}
            </pre>
          ) : (
            <p className="text-neutral-500 text-xs font-mono py-2 text-center italic">
              No lyrics found for this track
            </p>
          )}
        </div>
      )}

      {/* Playlist Selector Modal */}
      {showPlaylistModal && trackId && (
        <PlaylistSelectorModal
          trackId={trackId}
          trackName={title}
          artistName={artist}
          albumName={album}
          albumId={effectiveAlbumId || ""}
          thumbnailUrl={artworkUrl || ""}
          durationMs={track?.length}
          onClose={() => setShowPlaylistModal(false)}
        />
      )}
    </div>
  );
}
