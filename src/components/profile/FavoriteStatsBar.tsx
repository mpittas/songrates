"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  FaHeart,
  FaTimes,
  FaMusic,
  FaCompactDisc,
  FaMicrophoneAlt,
} from "react-icons/fa";
import OptimizedImage from "@/components/ui/OptimizedImage";
import { createSlug } from "@/lib/utils";

export interface FavoriteItem {
  id: string;
  item_id: string;
  item_type: "track" | "album" | "artist";
  item_name: string | null;
  artist_name: string | null;
  thumbnail_url: string | null;
  created_at: string;
}

interface FavoriteStatsBarProps {
  favorites: FavoriteItem[];
  loading: boolean;
  albumRatings?: Record<
    string,
    { id: string; title: string; ratedTrackIds: string[] }
  >;
  variant?: "default" | "compact";
  className?: string;
}

export default function FavoriteStatsBar({
  favorites,
  loading,
  albumRatings = {},
  variant = "default",
  className = "",
}: FavoriteStatsBarProps) {
  const [modalType, setModalType] = useState<
    "artist" | "album" | "track" | null
  >(null);

  const stats = useMemo(
    () => ({
      tracks: favorites.filter((f) => f.item_type === "track").length,
      albums: favorites.filter((f) => f.item_type === "album").length,
      artists: favorites.filter((f) => f.item_type === "artist").length,
    }),
    [favorites],
  );

  const modalItems = modalType
    ? favorites.filter((f) => f.item_type === modalType)
    : [];

  const modalTitle =
    modalType === "artist"
      ? "Liked Artists"
      : modalType === "album"
        ? "Liked Albums"
        : "Liked Tracks";

  const statDisplay = (count: number) =>
    loading ? (
      <div className="h-7 w-8 mx-auto bg-neutral-800 animate-pulse rounded" />
    ) : (
      <div className="text-2xl font-light text-white">{count}</div>
    );

  const renderFavoriteCard = (item: FavoriteItem) => {
    const isTrack = item.item_type === "track";
    const isAlbum = item.item_type === "album";
    const isArtist = item.item_type === "artist";

    let href = "#";
    if (isTrack) {
      const parentAlbum = Object.values(albumRatings).find((a) =>
        a.ratedTrackIds.includes(item.item_id),
      );
      if (parentAlbum) {
        href = `/album/${createSlug(parentAlbum.title, parentAlbum.id)}?track=${item.item_id}`;
      }
    } else if (isAlbum && item.item_name) {
      href = `/album/${createSlug(item.item_name, item.item_id)}`;
    } else if (isArtist && item.item_name) {
      href = `/artist/${createSlug(item.item_name, item.item_id)}`;
    }

    return (
      <Link
        key={item.id}
        href={href}
        onClick={() => setModalType(null)}
        className="group flex items-center gap-4 p-3 bg-neutral-900/30 border border-white/[0.04] hover:border-[#00f0ff]/20 hover:bg-neutral-900/50 transition-all duration-200 rounded-sm"
      >
        <div className="relative w-12 h-12 shrink-0 bg-neutral-800 overflow-hidden rounded-sm">
          {item.thumbnail_url ? (
            <OptimizedImage
              src={item.thumbnail_url}
              alt={item.item_name || "Unknown"}
              fill
              className="object-cover"
              fallbackSrc="/vinyl-placeholder.svg"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-neutral-800/80">
              {isTrack && <FaMusic size={16} className="text-neutral-600" />}
              {isAlbum && (
                <FaCompactDisc size={16} className="text-neutral-600" />
              )}
              {isArtist && (
                <FaMicrophoneAlt size={16} className="text-neutral-600" />
              )}
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <h4 className="text-sm text-white truncate group-hover:text-[#00f0ff] transition-colors">
            {item.item_name || "Unknown"}
          </h4>
          {item.artist_name && (
            <p className="text-xs text-neutral-500 truncate mt-0.5">
              {item.artist_name}
            </p>
          )}
        </div>

        <FaHeart
          size={12}
          className="text-red-500/60 shrink-0 group-hover:text-red-400 transition-colors"
        />
      </Link>
    );
  };

  const baseButtonClasses =
    variant === "compact"
      ? "bg-neutral-900/30 border border-white/[0.04] p-3 text-center hover:border-[#00f0ff]/20 hover:bg-neutral-900/50 transition-all duration-200 cursor-pointer rounded-sm"
      : "bg-neutral-900/30 border border-white/[0.04] p-4 text-center hover:border-[#00f0ff]/20 hover:bg-neutral-900/50 transition-all duration-200 cursor-pointer";

  const labelClasses =
    variant === "compact"
      ? "text-[9px] uppercase tracking-widest text-neutral-500 mt-1 flex items-center justify-center gap-1.5"
      : "text-[10px] uppercase tracking-widest text-neutral-500 mt-1 flex items-center justify-center gap-1.5";

  return (
    <>
      <div className={`grid grid-cols-3 gap-3 ${className}`}>
        <button
          onClick={() => setModalType("artist")}
          className={baseButtonClasses}
          disabled={loading}
        >
          {statDisplay(stats.artists)}
          <div className={labelClasses}>
            <FaHeart size={8} className="text-red-500/50" />
            Artists
          </div>
        </button>
        <button
          onClick={() => setModalType("album")}
          className={baseButtonClasses}
          disabled={loading}
        >
          {statDisplay(stats.albums)}
          <div className={labelClasses}>
            <FaHeart size={8} className="text-red-500/50" />
            Albums
          </div>
        </button>
        <button
          onClick={() => setModalType("track")}
          className={baseButtonClasses}
          disabled={loading}
        >
          {statDisplay(stats.tracks)}
          <div className={labelClasses}>
            <FaHeart size={8} className="text-red-500/50" />
            Tracks
          </div>
        </button>
      </div>

      {/* Favorites Modal */}
      {modalType && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          onClick={() => setModalType(null)}
        >
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
          <div
            className="relative w-full max-w-lg max-h-[80vh] bg-[#0a0a0d] border border-white/[0.06] shadow-2xl flex flex-col rounded-lg"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06] shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-1 h-5 bg-red-500 rounded-full" />
                <h2 className="text-lg font-light tracking-tight text-white">
                  {modalTitle}
                </h2>
                <span className="text-xs text-neutral-600 font-mono">
                  {modalItems.length}
                </span>
              </div>
              <button
                onClick={() => setModalType(null)}
                className="text-neutral-500 hover:text-white transition-colors p-1 hover:bg-neutral-800 rounded"
              >
                <FaTimes size={16} />
              </button>
            </div>

            {/* Modal Content */}
            <div className="overflow-y-auto flex-1 p-4">
              {loading ? (
                <div className="py-16 flex items-center justify-center">
                  <div className="w-6 h-6 border-2 border-[#00f0ff] border-t-transparent rounded-full animate-spin" />
                </div>
              ) : modalItems.length === 0 ? (
                <div className="py-16 text-center">
                  <FaHeart
                    size={24}
                    className="text-neutral-700 mx-auto mb-3"
                  />
                  <p className="text-neutral-600 font-mono text-sm">
                    No liked {modalType}s yet
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {modalItems.map(renderFavoriteCard)}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
