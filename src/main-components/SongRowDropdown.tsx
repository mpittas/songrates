"use client";

import { useState, useRef, useEffect } from "react";
import { FaPlus } from "react-icons/fa6";
import { BsThreeDotsVertical } from "react-icons/bs";
import { HiOutlineMicrophone } from "react-icons/hi2";
import { FiShare2 } from "react-icons/fi";
import FavoriteButton from "@/components/ui/FavoriteButton";

interface SongRowDropdownProps {
  isLyricsOpen: boolean;
  onToggleLyrics: () => void;
  onAddToPlaylist: () => void;
  onShare?: () => void;
  /** Warm lyrics cache when user hovers "Show Lyrics" before clicking */
  onPrefetchLyrics?: () => void;
  trackId?: string;
  trackName?: string;
  artistName?: string;
  thumbnailUrl?: string | null;
  albumId?: string;
  albumName?: string;
  durationMs?: number;
  artistId?: string;
  artists?: { id: string; name: string }[];
  onFavoriteChange?: (isFavorite: boolean) => void;
}

export default function SongRowDropdown({
  isLyricsOpen,
  onToggleLyrics,
  onAddToPlaylist,
  onShare,
  onPrefetchLyrics,
  trackId,
  trackName,
  artistName,
  thumbnailUrl,
  albumId,
  albumName,
  durationMs,
  artistId,
  artists,
  onFavoriteChange,
}: SongRowDropdownProps) {
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const MenuItem = ({
    icon,
    label,
    onClick,
    onMouseEnter,
  }: {
    icon?: React.ReactNode;
    label: string;
    onClick: () => void;
    onMouseEnter?: () => void;
  }) => (
    <button
      type="button"
      onMouseEnter={onMouseEnter}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
        setShowDropdown(false);
      }}
      className="w-full text-left flex items-center gap-3 px-3 py-2 text-sm font-mono text-neutral-600 hover:text-neutral-900 hover:bg-[#f5f5f5] transition-colors"
    >
      <div className="w-4 flex justify-center">{icon}</div>
      <span>{label}</span>
    </button>
  );

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
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

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setShowDropdown((s) => !s)}
        className="p-1.5 rounded-md text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition-colors"
        aria-label="More options"
      >
        <BsThreeDotsVertical size={14} />
      </button>

      {showDropdown && (
        <div className="absolute right-0 top-full mt-1 bg-white border border-neutral-200 rounded-lg shadow-xl py-1 z-50 w-48">
          {trackId && trackName && (
            <FavoriteButton
              itemId={trackId}
              itemType="track"
              itemName={trackName}
              artistName={artistName}
              thumbnailUrl={thumbnailUrl ?? undefined}
              albumId={albumId}
              albumName={albumName}
              durationMs={durationMs}
              artistId={artistId}
              artists={artists}
              variant="menu-item"
              menuTheme="light"
              onMenuClick={() => setShowDropdown(false)}
              onFavoriteChange={onFavoriteChange}
            />
          )}

          <MenuItem
            icon={<FaPlus size={12} />}
            label="Add to Playlist"
            onClick={onAddToPlaylist}
          />

          <MenuItem
            icon={<HiOutlineMicrophone size={12} />}
            label={isLyricsOpen ? "Hide Lyrics" : "Show Lyrics"}
            onClick={onToggleLyrics}
            onMouseEnter={onPrefetchLyrics}
          />

          <div className="border-t border-neutral-100 my-1" />

          {onShare && (
            <MenuItem icon={<FiShare2 size={12} />} label="Share" onClick={onShare} />
          )}
        </div>
      )}
    </div>
  );
}
