"use client";

import React from "react";
import { FaGlobe, FaStar } from "react-icons/fa";

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
  const baseColor = COLORS[colorIndex] || COLORS[COLORS.length - 1];

  return (
    <div
      className={`w-full flex flex-col md:flex-row items-stretch md:items-center bg-neutral-950 border border-[#1a1a1f] mb-8 ${className}`}
    >
      {/* Public Rating Section */}
      <div className="flex-1 px-6 py-5 flex items-center justify-between md:justify-start gap-6 border-b md:border-b-0 md:border-r border-[#1a1a1f]">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-[#1a1a1f] flex items-center justify-center text-neutral-500">
            <FaGlobe size={16} />
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] text-neutral-600 font-mono uppercase tracking-widest mb-0.5">
              Public Rating
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-bold text-neutral-200">
                {publicRating ? publicRating : "--"}
              </span>
              <span className="text-xs text-neutral-700 font-mono">/ 10</span>
            </div>
          </div>
        </div>

        {publicCount !== undefined && (
          <div className="text-right md:text-left pl-4 border-l border-[#1a1a1f] hidden sm:block">
            <div className="text-[10px] text-neutral-700 uppercase tracking-wider">
              based on
            </div>
            <div className="text-xs text-neutral-500 font-mono">
              {publicCount} users
            </div>
          </div>
        )}
      </div>

      {/* Personal Rating Section */}
      <div className="flex-1 px-6 py-5 flex items-center justify-between">
        <div className="flex items-center gap-5">
          <div
            className="w-10 h-10 flex items-center justify-center font-bold text-lg text-white text-shadow-sm"
            style={{ backgroundColor: baseColor }}
          >
            {safeScore > 0 ? safeScore : "-"}
          </div>

          <div className="flex flex-col min-w-[140px]">
            <span className="text-[10px] text-neutral-600 font-mono uppercase tracking-widest mb-0.5">
              My Average
            </span>
            <div className="flex flex-col gap-1 w-full">
              <div className="h-1 w-full bg-[#1a1a1f]">
                <div
                  className="h-full transition-all duration-300 ease-out"
                  style={{
                    width: `${totalTracks > 0 ? (ratedCount / totalTracks) * 100 : 0}%`,
                    backgroundColor: baseColor,
                  }}
                />
              </div>
              <span className="text-[10px] text-neutral-500 font-mono text-right">
                {isFull ? (
                  <span className="text-neutral-400">Complete</span>
                ) : (
                  `${ratedCount}/${totalTracks} rated`
                )}
              </span>
            </div>
          </div>
        </div>

        {/* Minimalist decoration */}
        {safeScore > 0 && (
          <div className="hidden md:block opacity-20 transform rotate-12">
            <FaStar className="text-neutral-700" size={24} />
          </div>
        )}
      </div>
    </div>
  );
}
