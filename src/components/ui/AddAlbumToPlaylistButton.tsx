"use client";

import { useState } from "react";
import { FaPlus, FaListUl } from "react-icons/fa";
import { useAuth } from "@/context/AuthContext";
import AlbumPlaylistSelectorModal from "./AlbumPlaylistSelectorModal";

interface AddAlbumToPlaylistButtonProps {
  albumId: string;
  albumName?: string;
  artistName?: string;
  thumbnailUrl?: string;
  releaseDate?: string;
  totalTracks?: number;
  size?: "sm" | "md" | "lg";
  className?: string;
  variant?: "icon" | "button";
}

export default function AddAlbumToPlaylistButton({
  albumId,
  albumName,
  artistName,
  thumbnailUrl,
  releaseDate,
  totalTracks,
  size = "sm",
  className = "",
  variant = "icon",
}: AddAlbumToPlaylistButtonProps) {
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
    if (!user) return;
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
          <AlbumPlaylistSelectorModal
            albumId={albumId}
            albumName={albumName}
            artistName={artistName}
            thumbnailUrl={thumbnailUrl}
            releaseDate={releaseDate}
            totalTracks={totalTracks}
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
        title="Add album to playlist"
        aria-label="Add album to playlist"
      >
        <FaPlus size={iconSizes[size] * 0.7} />
      </button>

      {isModalOpen && (
        <AlbumPlaylistSelectorModal
          albumId={albumId}
          albumName={albumName}
          artistName={artistName}
          thumbnailUrl={thumbnailUrl}
          releaseDate={releaseDate}
          totalTracks={totalTracks}
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </>
  );
}
