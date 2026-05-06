"use client";

import { useState } from "react";
import { FaPlus, FaListUl } from "react-icons/fa";
import { useAuth } from "@/context/AuthContext";
import AlbumPlaylistSelectorModal from "./AlbumPlaylistSelectorModal";
import Button from "./Button";

interface AddAlbumToPlaylistButtonProps {
  albumId: string;
  albumName?: string;
  artistName?: string;
  thumbnailUrl?: string;
  releaseDate?: string;
  totalTracks?: number;
  size?: "sm" | "md" | "lg";
  className?: string;
  variant?: "icon" | "button" | "text" | "secondary";
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

  if (variant === "button" || variant === "text") {
    const isText = variant === "text";
    return (
      <>
        <button
          onClick={handleClick}
          className={`
            flex items-center gap-2
            ${isText ? "" : "px-3 py-2 text-xs font-mono uppercase tracking-wider border border-[#d7d7d7] hover:border-[#c7c7c7] bg-white hover:bg-[#f8f8f8] rounded-md"}
            ${isText ? "text-neutral-500 hover:text-neutral-900 transition-colors group" : "text-neutral-600 hover:text-neutral-900 transition-all duration-200"}
            ${className}
          `}
        >
          <FaListUl
            size={isText ? 10 : 12}
            className={
              isText
                ? "group-hover:scale-110 transition-transform opacity-70 group-hover:opacity-100"
                : ""
            }
          />
          <span>Add to Playlist</span>
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

  if (variant === "secondary") {
    return (
      <>
        <Button
          variant="secondary"
          onClick={handleClick}
          className={className}
          iconLeft={<FaPlus size={14} className="text-black mr-2" />}
        >
          SAVE ALBUM
        </Button>

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
          text-neutral-500 hover:text-neutral-900
          hover:bg-neutral-200
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
