"use client";

import { useState, useRef, useEffect } from "react";
import { FaPlus } from "react-icons/fa6";
import { BsThreeDotsVertical } from "react-icons/bs";
import { HiOutlineMicrophone } from "react-icons/hi2";

interface SongRowDropdownProps {
  isLyricsOpen: boolean;
  onToggleLyrics: () => void;
  onAddToPlaylist: () => void;
  onGoToAlbum?: () => void;
  onGoToArtist?: () => void;
  onShare?: () => void;
}

export default function SongRowDropdown({
  isLyricsOpen,
  onToggleLyrics,
  onAddToPlaylist,
  onGoToAlbum,
  onGoToArtist,
  onShare,
}: SongRowDropdownProps) {
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

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
          <button
            onClick={(e) => {
              e.stopPropagation();
              onAddToPlaylist();
              setShowDropdown(false);
            }}
            className="w-full text-left flex items-center gap-3 px-3 py-2 text-xs font-mono text-neutral-600 hover:text-neutral-900 hover:bg-[#f5f5f5] transition-colors"
          >
            <div className="w-4 flex justify-center">
              <FaPlus size={12} />
            </div>
            <span>Add to Playlist</span>
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleLyrics();
              setShowDropdown(false);
            }}
            className="w-full text-left flex items-center gap-3 px-3 py-2 text-xs font-mono text-neutral-600 hover:text-neutral-900 hover:bg-[#f5f5f5] transition-colors"
          >
            <div className="w-4 flex justify-center">
              <HiOutlineMicrophone size={12} />
            </div>
            <span>{isLyricsOpen ? "Hide Lyrics" : "Show Lyrics"}</span>
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
  );
}
