"use client";

import { useState } from "react";
import { FaHeart, FaRegHeart } from "react-icons/fa";
import { useFavorites } from "@/context/FavoritesContext";
import { MENU_ITEM_CLASS } from "@/components/ui/ContextDropdown";
import { cn } from "@/lib/utils";
import Button, { type ButtonSize, type ButtonVariant } from "./Button";

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
  buttonSize?: ButtonSize;
  /** Button style when `variant="secondary"` */
  buttonVariant?: ButtonVariant;
  /** Render the `secondary` variant as a round icon-only button. */
  iconOnly?: boolean;
  className?: string;
  variant?: "icon" | "text" | "menu-item" | "secondary";
  /** Menu dropdown surface; `light` for SongRow, `dark` for album track menus */
  menuTheme?: "light" | "dark";
  onMenuClick?: () => void;
  onFavoriteChange?: (isFavorite: boolean) => void;
}

function HeartIcon({ filled, size }: { filled: boolean; size: number }) {
  return filled ? (
    <FaHeart size={size} className="text-accent" />
  ) : (
    <FaRegHeart size={size} />
  );
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
  buttonVariant = "border",
  iconOnly = false,
  className = "",
  variant = "icon",
  onMenuClick,
  onFavoriteChange,
}: FavoriteButtonProps) {
  const [loading, setLoading] = useState(false);
  const { isFavorite: getIsFavorite, toggleFavorite: toggleCachedFavorite } =
    useFavorites();
  const isFavorite = getIsFavorite(itemId, itemType);

  const sizeClasses = {
    sm: "size-6",
    md: "size-8",
    lg: "size-11",
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

  const noun =
    itemType === "artist" ? "artist" : itemType === "track" ? "song" : "album";
  const actionLabel = isFavorite ? `Unlike ${noun}` : `Like ${noun}`;

  if (variant === "text") {
    return (
      <button
        type="button"
        onClick={toggleFavorite}
        disabled={loading}
        className={cn(
          "group flex cursor-pointer items-center gap-2 text-ink-2 transition-colors hover:text-ink disabled:cursor-not-allowed disabled:opacity-50",
          className,
        )}
      >
        <HeartIcon filled={isFavorite} size={12} />
        <span>{isFavorite ? "Liked" : "Like"}</span>
      </button>
    );
  }

  if (variant === "secondary") {
    return (
      <Button
        variant={buttonVariant}
        size={buttonSize}
        icon={iconOnly}
        onClick={toggleFavorite}
        disabled={loading}
        className={className}
        aria-label={actionLabel}
        aria-pressed={isFavorite}
        title={actionLabel}
        iconLeft={
          iconOnly ? undefined : <HeartIcon filled={isFavorite} size={14} />
        }
      >
        {iconOnly ? (
          <HeartIcon filled={isFavorite} size={16} />
        ) : isFavorite ? (
          "Liked"
        ) : (
          "Like"
        )}
      </Button>
    );
  }

  if (variant === "menu-item") {
    const likeLabel =
      itemType === "artist"
        ? isFavorite
          ? "Remove from favourites"
          : "Like artist"
        : isFavorite
          ? "Liked"
          : itemType === "track"
            ? "Like song"
            : "Like album";

    return (
      <button
        type="button"
        role="menuitem"
        onClick={(e) => {
          e.stopPropagation();
          void toggleFavorite();
          onMenuClick?.();
        }}
        disabled={loading}
        className={cn(
          MENU_ITEM_CLASS,
          "disabled:cursor-not-allowed disabled:opacity-50",
          className,
        )}
      >
        <span className="flex w-4 shrink-0 justify-center text-ink-3">
          <HeartIcon filled={isFavorite} size={12} />
        </span>
        <span>{likeLabel}</span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={toggleFavorite}
      disabled={loading}
      className={cn(
        sizeClasses[size],
        "flex cursor-pointer items-center justify-center rounded-full transition-colors disabled:cursor-not-allowed disabled:opacity-50",
        isFavorite ? "text-accent" : "text-ink-3 hover:text-ink",
        className,
      )}
      aria-label={actionLabel}
      aria-pressed={isFavorite}
    >
      {isFavorite ? (
        <FaHeart size={iconSizes[size]} className="fill-current" />
      ) : (
        <FaRegHeart size={iconSizes[size]} className="fill-current" />
      )}
    </button>
  );
}
