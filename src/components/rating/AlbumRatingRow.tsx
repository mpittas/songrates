"use client";

import React from "react";
import { FaGlobe } from "react-icons/fa";
import { RATING_COLORS } from "./constants";

interface AlbumRatingRowProps {
  score: number | string;
  ratedCount: number;
  totalTracks: number;
  isFull: boolean;
  className?: string;
  publicRating?: number | null;
  publicCount?: number;
}

export default function AlbumRatingRow({
  score,
  ratedCount,
  totalTracks,
  isFull,
  className = "",
  publicRating,
  publicCount,
}: AlbumRatingRowProps) {
  // Determine color based on score
  const numericScore =
    typeof score === "number" ? score : parseFloat(score as string);
  const safeScore = !isNaN(numericScore) ? numericScore : 0;
  // Clamp score between 1 and 10 and map to index (0-9)
  const colorIndex =
    safeScore > 0 ? Math.min(Math.max(Math.round(safeScore), 1), 10) - 1 : 9;
  const baseColor =
    RATING_COLORS[colorIndex] || RATING_COLORS[RATING_COLORS.length - 1];

  return (
    <div
      className={`w-full flex flex-col md:flex-row items-stretch bg-neutral-950 border border-[#1a1a1f] mb-8 ${className}`}
    >
      {/* Public Rating Section (Left) */}
      <div className="flex-1 px-6 py-5 flex items-center justify-between border-b md:border-b-0 md:border-r border-[#1a1a1f]">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-[#1a1a1f] flex items-center justify-center text-neutral-500">
            <FaGlobe size={16} />
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] text-neutral-600 font-mono uppercase tracking-widest mb-0.5">
              Public Rating
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-bold text-neutral-100">
                {publicRating ? publicRating : "--"}
              </span>
              <span className="text-xs text-neutral-700 font-mono">/ 10</span>
            </div>
          </div>
        </div>

        {publicCount !== undefined && (
          <div className="text-right pl-4">
            <div className="text-[10px] text-neutral-700 uppercase tracking-wider">
              based on
            </div>
            <div className="text-xs text-neutral-500 font-mono">
              {publicCount} users
            </div>
          </div>
        )}
      </div>

      {/* Personal Rating Section (Right) */}
      <div className="flex-1 px-6 py-5 flex items-center justify-between">
        <div className="flex items-center gap-5 w-full">
          <div
            className="w-10 h-10 flex items-center justify-center font-bold text-lg text-white"
            style={{ backgroundColor: baseColor }}
          >
            {safeScore > 0 ? safeScore : "-"}
          </div>

          <div className="flex flex-col flex-1">
            <span className="text-[10px] text-neutral-600 font-mono uppercase tracking-widest mb-0.5">
              My Average
            </span>
            <div className="flex flex-col gap-1 w-full max-w-[200px] h-full">
              <span className="text-sm text-neutral-400 font-mono">
                {isFull ? (
                  <span className="text-neutral-400">Completed</span>
                ) : (
                  `${ratedCount}/${totalTracks} rated`
                )}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
