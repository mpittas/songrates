"use client";

import { useState, useEffect } from "react";

interface ColorRatingProps {
  rating: number;
  onRate: (rating: number) => void;
  max?: number;
}

const COLORS = [
  "#a31616ff", // 1
  "#b8441aff", // 2
  "#ca7a23ff", // 3
  "#bb9920ff", // 4
  "#b3c022ff", // 5
  "#8ec227ff", // 6
  "#65c227ff", // 7
  "#3ec227ff", // 8
  "#21b691ff", // 9
  "#14bba5ff", // 10
];

export default function ColorRating({
  rating,
  onRate,
  max = 10,
}: ColorRatingProps) {
  const [hovered, setHovered] = useState<number | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div
      className="flex gap-[0px] h-1 items-end"
      onMouseLeave={() => setHovered(null)}
    >
      {Array.from({ length: max }).map((_, i) => {
        const value = i + 1;
        const isActive = (hovered !== null ? hovered : rating) >= value;
        const color = COLORS[i] || "#444";

        return (
          <button
            key={value}
            onMouseEnter={() => setHovered(value)}
            onClick={() => onRate(value)}
            className={`w-2 h-full transition-all duration-150 relative group`}
            style={{
              backgroundColor: isActive ? color : "#1a1a1f",
              boxShadow: isActive ? `0 0 10px ${color}44` : "none",
            }}
          >
            {/* Tooltip on hover or default rating */}
            {mounted &&
              (hovered !== null ? hovered === value : rating === value) && (
                <span className="absolute -top-6 left-1/2 -translate-x-1/2 bg-[#1a1a1f] text-neutral-400 text-[8px] font-mono px-1 py-0.5 pointer-events-none z-10 whitespace-nowrap">
                  {value}
                </span>
              )}
          </button>
        );
      })}
    </div>
  );
}
