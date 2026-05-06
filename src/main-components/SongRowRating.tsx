"use client";

import { useState, useRef, useEffect } from "react";
import { useRatingsContext } from "@/context/RatingsContext";
import { AlbumContext } from "@/types/music";

interface SongRowRatingProps {
  trackId?: string;
  albumContext?: AlbumContext;
  displayRating?: number | null;
  onRate?: (rating: number) => void;
}

const ratingColors: Record<number, string> = {
  1: "bg-red-500",
  2: "bg-red-400",
  3: "bg-orange-400",
  4: "bg-orange-300",
  5: "bg-yellow-400",
  6: "bg-yellow-300",
  7: "bg-lime-400",
  8: "bg-green-400",
  9: "bg-emerald-400",
  10: "bg-emerald-500",
};

export default function SongRowRating({
  trackId,
  albumContext,
  displayRating,
  onRate,
}: SongRowRatingProps) {
  const [showRatingPopover, setShowRatingPopover] = useState(false);
  const ratingRef = useRef<HTMLDivElement>(null);
  const { setRating } = useRatingsContext();

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ratingRef.current && !ratingRef.current.contains(e.target as Node)) {
        setShowRatingPopover(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const ratingBg =
    displayRating && displayRating > 0
      ? ratingColors[displayRating]
      : "bg-neutral-200";

  return (
    <div className="relative" ref={ratingRef}>
      <button
        onClick={() => setShowRatingPopover((s) => !s)}
        className={`w-8 h-8 rounded-full ${ratingBg} flex items-center justify-center text-xs font-semibold transition-all hover:scale-105 ${
          displayRating && displayRating > 0 ? "text-white" : "text-neutral-500"
        }`}
        aria-label="Rate song"
      >
        {displayRating && displayRating > 0 ? displayRating : "−"}
      </button>

      {showRatingPopover && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-white border border-neutral-200 rounded-lg shadow-xl p-2 z-50 w-[200px]">
          <div className="text-xs text-neutral-500 mb-2 px-1">
            Rate this track
          </div>
          <div className="grid grid-cols-5 gap-1">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
              <button
                key={n}
                onClick={() => {
                  if (trackId) {
                    setRating(trackId, n, albumContext);
                  }
                  onRate?.(n);
                  setShowRatingPopover(false);
                }}
                className={`w-7 h-7 rounded-full text-xs font-semibold transition-all hover:scale-110 ${
                  displayRating === n
                    ? `${ratingColors[n]} text-white`
                    : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
                }`}
              >
                {n}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
