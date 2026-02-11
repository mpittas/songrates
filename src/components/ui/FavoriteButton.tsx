"use client";

import { useState, useEffect } from "react";
import { FaHeart, FaRegHeart } from "react-icons/fa";
import { createClient } from "@/utils/supabase/client";

interface FavoriteButtonProps {
  itemId: string;
  itemType: "track" | "album" | "artist";
  itemName?: string;
  artistName?: string;
  thumbnailUrl?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
  variant?: "icon" | "text";
}

export default function FavoriteButton({
  itemId,
  itemType,
  itemName,
  artistName,
  thumbnailUrl,
  size = "md",
  className = "",
  variant = "icon",
}: FavoriteButtonProps) {
  const [isFavorite, setIsFavorite] = useState(false);
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

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

  // Check if item is favorited
  useEffect(() => {
    const checkFavorite = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("user_favorites")
        .select("id")
        .eq("user_id", user.id)
        .eq("item_id", itemId)
        .eq("item_type", itemType)
        .maybeSingle();

      if (!error && data) {
        setIsFavorite(true);
      }
    };

    checkFavorite();
  }, [itemId, itemType, supabase]);

  const toggleFavorite = async () => {
    setLoading(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        // Redirect to login or show login modal
        return;
      }

      if (isFavorite) {
        // Remove from favorites
        const { error } = await supabase
          .from("user_favorites")
          .delete()
          .eq("user_id", user.id)
          .eq("item_id", itemId)
          .eq("item_type", itemType);

        if (error) throw error;
        setIsFavorite(false);
      } else {
        // Add to favorites
        const { error } = await supabase.from("user_favorites").upsert({
          user_id: user.id,
          item_id: itemId,
          item_type: itemType,
          item_name: itemName,
          artist_name: artistName,
          thumbnail_url: thumbnailUrl,
        });

        if (error) throw error;
        setIsFavorite(true);
      }
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
