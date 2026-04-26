"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { FaPlay, FaPause } from "react-icons/fa6";
import { BsThreeDotsVertical } from "react-icons/bs";
import { IoDiscOutline } from "react-icons/io5";
import { usePlayer } from "@/context/PlayerContext";
import { useRatingsContext } from "@/context/RatingsContext";
import { Track, AlbumContext } from "@/types/music";
import { createSlug } from "@/lib/utils";

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
  const ratingRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const {
    currentTrack,
    isPlaying: isPlayerPlaying,
    isLoading,
    playTrack,
  } = usePlayer();
  const isCurrentTrack = currentTrack?.id === track?.id;

  const { ratings, setRating } = useRatingsContext();
  const trackId = track?.id;
  const contextRating = trackId ? (ratings[trackId] ?? 0) : 0;
  const displayRating = rating ?? contextRating;

  const effectiveArtistId = track?.artistId ?? artistId;
  const effectiveAlbumId = track?.albumId ?? albumId;

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
      className="flex items-center gap-3 px-3 py-2.5 bg-white rounded-lg border border-neutral-100 hover:border-neutral-200 transition-colors group"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => {
        setHovered(false);
        setShowRatingPopover(false);
      }}
    >
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
              aria-label={isCurrentTrack && isPlayerPlaying ? "Pause" : "Play"}
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
            <div className="absolute right-0 top-full mt-1 bg-white border border-neutral-200 rounded-lg shadow-xl py-1 z-50 w-44">
              {onAddToPlaylist && (
                <button
                  onClick={() => {
                    onAddToPlaylist();
                    setShowDropdown(false);
                  }}
                  className="w-full text-left px-3 py-2 text-sm text-neutral-700 hover:bg-neutral-50 transition-colors"
                >
                  Add to Playlist
                </button>
              )}
              {onGoToAlbum && (
                <button
                  onClick={() => {
                    onGoToAlbum();
                    setShowDropdown(false);
                  }}
                  className="w-full text-left px-3 py-2 text-sm text-neutral-700 hover:bg-neutral-50 transition-colors"
                >
                  Go to Album
                </button>
              )}
              {onGoToArtist && (
                <button
                  onClick={() => {
                    onGoToArtist();
                    setShowDropdown(false);
                  }}
                  className="w-full text-left px-3 py-2 text-sm text-neutral-700 hover:bg-neutral-50 transition-colors"
                >
                  Go to Artist
                </button>
              )}
              <div className="border-t border-neutral-100 my-1" />
              {onShare && (
                <button
                  onClick={() => {
                    onShare();
                    setShowDropdown(false);
                  }}
                  className="w-full text-left px-3 py-2 text-sm text-neutral-700 hover:bg-neutral-50 transition-colors"
                >
                  Share
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
