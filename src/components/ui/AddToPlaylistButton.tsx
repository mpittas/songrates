"use client";

import { useState } from "react";
import { FaPlus, FaCheck, FaListUl } from "react-icons/fa";
import { usePlaylist } from "@/context/PlaylistContext";
import { useAuth } from "@/context/AuthContext";
import PlaylistSelectorModal from "./PlaylistSelectorModal";

interface AddToPlaylistButtonProps {
  trackId: string;
  trackName?: string;
  artistName?: string;
  albumName?: string;
  albumId?: string;
  thumbnailUrl?: string;
  durationMs?: number;
  size?: "sm" | "md" | "lg";
  className?: string;
  variant?: "icon" | "button";
}

export default function AddToPlaylistButton({
  trackId,
  trackName,
  artistName,
  albumName,
  albumId,
  thumbnailUrl,
  durationMs,
  size = "sm",
  className = "",
  variant = "icon",
}: AddToPlaylistButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { user } = useAuth();

  const sizeClasses = {
    sm: "w-6 h-6",
    md: "w-8 h-8",
    lg: "w-10 h-10",
  };

  const iconSizes = {
    sm: 12,
    md: 16,
    lg: 20,
  };

  const handleClick = () => {
    if (!user) {
      // Could redirect to login or show login modal
      return;
    }
    setIsModalOpen(true);
  };

  if (variant === "button") {
    return (
      <>
        <button
          onClick={handleClick}
          className={`
            flex items-center gap-2 px-3 py-2
            text-xs font-mono uppercase tracking-wider
            text-neutral-400 hover:text-white
            border border-white/[0.06] hover:border-[#00f0ff]/30
            bg-neutral-900/30 hover:bg-neutral-900/50
            transition-all duration-200
            ${className}
          `}
        >
          <FaListUl size={12} />
          Add to Playlist
        </button>

        {isModalOpen && (
          <PlaylistSelectorModal
            trackId={trackId}
            trackName={trackName}
            artistName={artistName}
            albumName={albumName}
            albumId={albumId}
            thumbnailUrl={thumbnailUrl}
            durationMs={durationMs}
            onClose={() => setIsModalOpen(false)}
          />
        )}
      </>
    );
  }

  return (
    <>
      <button
        onClick={handleClick}
        className={`
          ${sizeClasses[size]}
          flex items-center justify-center
          rounded-full
          transition-all duration-200
          text-neutral-500 hover:text-[#00f0ff]
          hover:bg-neutral-800
          cursor-pointer
          ${className}
        `}
        title="Add to playlist"
        aria-label="Add to playlist"
      >
        <FaPlus size={iconSizes[size] * 0.7} />
      </button>

      {isModalOpen && (
        <PlaylistSelectorModal
          trackId={trackId}
          trackName={trackName}
          artistName={artistName}
          albumName={albumName}
          albumId={albumId}
          thumbnailUrl={thumbnailUrl}
          durationMs={durationMs}
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </>
  );
}
