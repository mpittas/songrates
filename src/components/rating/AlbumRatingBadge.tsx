"use client";

import React from "react";
import { LuGlobe } from "react-icons/lu";

import { cn } from "@/lib/utils";
import { ratingColor } from "./constants";

interface AlbumRatingBadgeProps {
  score: number | string;
  ratedCount: number;
  totalTracks: number;
  isFull: boolean;
  className?: string;
  position?: "absolute" | "static" | "relative";
  publicRating?: number | null;
  publicCount?: number;
}

const CHIP =
  "flex h-6 items-center rounded-md px-1.5 text-[11px] font-semibold tabular-nums";
const GLASS = "bg-black/55 text-white/90 backdrop-blur-md";

/** Score chips floated over album artwork (your score, progress, public). */
export default function AlbumRatingBadge({
  score,
  ratedCount,
  totalTracks,
  isFull,
  className = "",
  position = "absolute",
  publicRating,
  publicCount,
}: AlbumRatingBadgeProps) {
  const numericScore =
    typeof score === "number" ? score : parseFloat(score as string);
  const hasScore = !isNaN(numericScore) && numericScore > 0;

  return (
    <div
      className={cn(
        "pointer-events-none flex items-end justify-between gap-1.5",
        position === "absolute"
          ? "absolute inset-x-2 bottom-2"
          : "relative w-full",
        className,
      )}
    >
      <div className="flex items-center gap-1">
        <span
          className={cn(CHIP, hasScore ? "text-white" : GLASS)}
          style={
            hasScore ? { backgroundColor: ratingColor(numericScore) } : undefined
          }
        >
          {score}
        </span>
        {totalTracks > 0 || isFull ? (
          <span className={cn(CHIP, GLASS, "font-medium")}>
            {isFull ? "Rated" : `${ratedCount}/${totalTracks}`}
          </span>
        ) : null}
      </div>

      {publicRating ? (
        <span
          className={cn(CHIP, GLASS, "gap-1 font-medium")}
          title={`Public rating: ${publicRating.toFixed(2)} from ${publicCount} ${
            publicCount === 1 ? "user" : "users"
          }`}
        >
          <LuGlobe size={11} aria-hidden />
          {publicRating.toFixed(1)}
        </span>
      ) : null}
    </div>
  );
}
