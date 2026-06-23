"use client";

import { useState } from "react";
import { FaHeart, FaRegHeart } from "react-icons/fa";
import { useFavorites } from "@/context/FavoritesContext";
import Button from "./Button";

interface FavoriteButtonProps {
  itemId: string;
  itemType: "track" | "album" | "artist";
  itemName?: string;
  artistName?: string;
  thumbnailUrl?: string;
  albumId?: string;
  albumName?: string;
  durationMs?: number;
  artistId?: string;
  artists?: { id: string; name: string }[];
  size?: "sm" | "md" | "lg";
  /** Passed to underlying `Button` when `variant="secondary"` */
  buttonSize?: "xxs" | "xs" | "sm" | "md" | "lg";
  className?: string;
  variant?: "icon" | "text" | "menu-item" | "secondary";
  /** Menu dropdown surface; `light` for SongRow, `dark` for album track menus */
  menuTheme?: "light" | "dark";
  onMenuClick?: () => void;
  onFavoriteChange?: (isFavorite: boolean) => void;
}

export default function FavoriteButton({
  itemId,
  itemType,
  itemName,
  artistName,
  thumbnailUrl,
  albumId,
  albumName,
  durationMs,
  artistId,
  artists,
  size = "md",
  buttonSize = "sm",
  className = "",
  variant = "icon",
  menuTheme = "dark",
  onMenuClick,
  onFavoriteChange,
}: FavoriteButtonProps) {
  const [loading, setLoading] = useState(false);
  const { isFavorite: getIsFavorite, toggleFavorite: toggleCachedFavorite } =
    useFavorites();
  const isFavorite = getIsFavorite(itemId, itemType);

  const sizeClasses = {
    sm: "w-6 h-6",
    md: "w-8 h-8",
    lg: "w-11 h-11",
  };

  const iconSizes = {
    sm: 12,
    md: 16,
    lg: 20,
  };

  const toggleFavorite = async () => {
    setLoading(true);
    try {
      const nextFavorite = await toggleCachedFavorite({
        itemId,
        itemType,
        itemName,
        artistName,
        thumbnailUrl,
        albumId,
        albumName,
        durationMs,
        artistId,
        artists,
      });
      if (nextFavorite !== null) onFavoriteChange?.(nextFavorite);
    } catch (err) {
      console.error("Error toggling favorite:", err);
    } finally {
      setLoading(false);
    }
  };

  if (variant === "text") {
    return (
      <button
        onClick={toggleFavorite}
        disabled={loading}
        className={`
          flex items-center gap-2
          text-neutral-500 hover:text-red-400
          transition-all duration-200 group
          ${loading ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
          ${className}
        `}
      >
        {isFavorite ? (
          <FaHeart
            size={10}
            className="fill-current group-hover:scale-110 transition-transform opacity-70 group-hover:opacity-100"
          />
        ) : (
          <FaRegHeart
            size={10}
            className="fill-current group-hover:scale-110 transition-transform opacity-70 group-hover:opacity-100"
          />
        )}
        <span>{isFavorite ? "Favorited" : "Favorite"}</span>
      </button>
    );
  }

  if (variant === "secondary") {
    const likeLabel =
      itemType === "artist"
        ? "LIKE ARTIST"
        : itemType === "track"
          ? "LIKE TRACK"
          : "LIKE ALBUM";
    return (
      <Button
        variant="secondary"
        size={buttonSize}
        onClick={toggleFavorite}
        disabled={loading}
        className={className}
        iconLeft={
          isFavorite ? (
            <FaHeart size={14} className="fill-current text-black mr-2" />
          ) : (
            <FaRegHeart size={14} className="fill-current text-black mr-2" />
          )
        }
      >
        {isFavorite ? "FAVORITED" : likeLabel}
      </Button>
    );
  }

  if (variant === "menu-item") {
    const menuItemThemeClasses =
      menuTheme === "light"
        ? "text-sm font-mono text-neutral-600 hover:text-neutral-900 hover:bg-[#f5f5f5]"
        : "text-xs font-mono text-neutral-400 hover:text-white hover:bg-white/5";

    const likeLabel =
      itemType === "track"
        ? isFavorite
          ? "Liked"
          : "Like song"
        : itemType === "album"
          ? isFavorite
            ? "Liked"
            : "Like album"
          : itemType === "artist"
            ? isFavorite
              ? "Remove from favourites"
              : "Like artist"
            : isFavorite
              ? "Favorited"
              : "Favorite";

    return (
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          void toggleFavorite();
          onMenuClick?.();
        }}
        disabled={loading}
        className={`
          w-full text-left flex items-center gap-3 px-3 py-2
          transition-colors
          ${menuItemThemeClasses}
          ${loading ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
          ${className}
        `}
      >
        <div className="w-4 flex justify-center">
          {isFavorite ? (
            <FaHeart size={12} className="text-red-500" />
          ) : (
            <FaRegHeart size={12} />
          )}
        </div>
        <span>{likeLabel}</span>
      </button>
    );
  }

  return (
    <button
      onClick={toggleFavorite}
      disabled={loading}
      className={`
        ${sizeClasses[size]}
        flex items-center justify-center
        rounded-full
        transition-all duration-200
        ${
          isFavorite
            ? "text-red-500 hover:text-red-400"
            : "text-neutral-500 hover:text-red-400"
        }
        ${loading ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
        ${className}
      `}
      aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
    >
      {isFavorite ? (
        <FaHeart size={iconSizes[size]} className="fill-current" />
      ) : (
        <FaRegHeart size={iconSizes[size]} className="fill-current" />
      )}
    </button>
  );
}
