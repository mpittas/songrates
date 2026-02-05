"use client";

import React from "react";

const COLORS = [
  "#a31616", // 1
  "#b8441a", // 2
  "#ca7a23", // 3
  "#bb9920", // 4
  "#b3c022", // 5
  "#8ec227", // 6
  "#65c227", // 7
  "#3ec227", // 8
  "#21b691", // 9
  "#14bba5", // 10
];

interface AlbumRatingBadgeProps {
  score: number | string;
  ratedCount: number;
  totalTracks: number;
  isFull: boolean;
  className?: string;
  position?: "absolute" | "static" | "relative";
}

export default function AlbumRatingBadge({
  score,
  ratedCount,
  totalTracks,
  isFull,
  className = "",
  position = "absolute",
}: AlbumRatingBadgeProps) {
  // Determine color based on score
  const numericScore =
    typeof score === "number" ? score : parseFloat(score as string);

  // Clean score for display/width calculation
  const safeScore = !isNaN(numericScore) ? numericScore : 0;

  // Clamp score between 1 and 10 and map to index (0-9)
  const colorIndex =
    safeScore > 0 ? Math.min(Math.max(Math.round(safeScore), 1), 10) - 1 : 9;

  const baseColor = COLORS[colorIndex] || COLORS[COLORS.length - 1];

  const positionClasses =
    position === "absolute"
      ? "absolute bottom-0 right-0 left-0"
      : "relative w-full";

  return (
    <div
      className={`${positionClasses} py-1 px-2 text-xs flex justify-between items-center backdrop-blur-md bg-[#050507]/80 border-t border-[#1a1a1f] ${className}`}
    >
      <span
        className="font-bold text-xs text-white p-0.5 min-w-[24px] text-center"
        style={{
          backgroundColor: baseColor,
        }}
      >
        {score}
      </span>

      {isFull ? (
        <span className="text-[10px] text-neutral-400 font-medium tracking-wide">
          Fully rated
        </span>
      ) : (
        <span className="text-[10px] text-neutral-400">
          {ratedCount}/{totalTracks} Rated
        </span>
      )}
    </div>
  );
}
