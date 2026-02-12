"use client";

import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { RATING_COLORS } from "./constants";

interface ColorRatingProps {
  rating: number;
  onRate: (rating: number) => void;
  max?: number;
}

export default function ColorRating({
  rating,
  onRate,
  max = 10,
}: ColorRatingProps) {
  const [isHovering, setIsHovering] = useState(false);
  const [hoveredRating, setHoveredRating] = useState<number | null>(null);
  const [popoverPos, setPopoverPos] = useState({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Current color or neutral if 0
  const displayRating = hoveredRating !== null ? hoveredRating : rating;
  const currentColor =
    displayRating > 0
      ? RATING_COLORS[displayRating - 1] || RATING_COLORS[9]
      : "#262626"; // neutral-800

  const handleRate = (value: number) => {
    const nextRating = value === rating ? 0 : value;
    onRate(nextRating);
  };

  const updatePopoverPosition = () => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      const scrollY = window.scrollY;
      const scrollX = window.scrollX;

      // Center popover horizontally relative to trigger, position above
      setPopoverPos({
        top: rect.top + scrollY - 10, // 10px spacing above usually, but wait, fixed position is relative to viewport?
        // If I use portal to document.body, it's relative to page usually if absolute, or viewport if fixed.
        // Let's use fixed position to be safe against parents with transform.
        // If fixed, top is just rect.top.
        left: rect.left + rect.width / 2,
      });
    }
  };

  useEffect(() => {
    if (isHovering) {
      updatePopoverPosition();
      // Update on scroll/resize to keep attached
      window.addEventListener("scroll", updatePopoverPosition, true);
      window.addEventListener("resize", updatePopoverPosition);
    }
    return () => {
      window.removeEventListener("scroll", updatePopoverPosition, true);
      window.removeEventListener("resize", updatePopoverPosition);
    };
  }, [isHovering]);

  return (
    <>
      <div
        ref={triggerRef}
        className="relative flex justify-center items-center group/rating w-7 h-7 z-10"
        onMouseEnter={() => {
          setIsHovering(true);
          updatePopoverPosition();
        }}
        onMouseLeave={() => {
          setIsHovering(false);
          setHoveredRating(null);
        }}
      >
        {/* Circle Badge - Smaller Size (24px approx) */}
        <div
          className="w-6 h-6 rounded-full flex items-center justify-center font-bold text-white transition-all duration-200 cursor-pointer shadow-lg border border-white/5 relative z-20"
          style={{
            backgroundColor: currentColor,
            boxShadow:
              displayRating > 0 ? `0 0 10px ${currentColor}40` : "none",
            transform: isHovering ? "scale(1.1)" : "scale(1)",
          }}
        >
          <span className="text-[10px] font-mono leading-none mt-[1px]">
            {rating > 0 ? rating : "-"}
          </span>
        </div>
      </div>

      {/* Portal for Popover to breakout of containers */}
      {isHovering &&
        mounted &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            className="fixed z-[9999] pointer-events-auto"
            style={{
              top: triggerRef.current
                ? triggerRef.current.getBoundingClientRect().top - 12
                : 0, // Using Rect top for Fixed position
              left: popoverPos.left,
              transform: "translate(-50%, -100%)", // Centered and above
            }}
            onMouseEnter={() => setIsHovering(true)}
            onMouseLeave={() => {
              setIsHovering(false);
              setHoveredRating(null);
            }}
          >
            {/* Invisible bridge not needed as much with portal if we overlap or track mouse?? 
                Actually, if the mouse leaves the trigger to go to the popover, we need to bridge the gap if there is one.
                The popover is 12px above. 
                Let's add a bridge area in the portal or just ensure they overlap or are very close.
                I added -12px top. So there is a gap.
                Let's extend a hit area downwards from the popover.
            */}
            <div className="absolute top-full left-1/2 -translate-x-1/2 w-full h-4 bg-transparent" />

            <div className="flex items-center gap-1 p-2 bg-[#0a0a0a]/95 backdrop-blur-xl rounded-full border border-white/10 shadow-2xl transition-all duration-200 animate-in fade-in zoom-in-95 slide-in-from-bottom-2">
              {Array.from({ length: max }).map((_, i) => {
                const value = i + 1;
                const color = RATING_COLORS[i] || "#444";
                const isCurrent = rating === value;
                const isPreview = hoveredRating === value;

                return (
                  <button
                    key={value}
                    className={`
                      w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold transition-all duration-150
                      ${isCurrent ? "ring-1 ring-white scale-110" : "hover:scale-125"}
                    `}
                    style={{
                      backgroundColor:
                        isCurrent || isPreview ? color : "#262626",
                      color: isCurrent || isPreview ? "white" : "#737373",
                      transform: isPreview ? "scale(1.3)" : undefined,
                    }}
                    onMouseEnter={() => setHoveredRating(value)}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRate(value);
                    }}
                    title={`Rate ${value}`}
                  >
                    {value}
                  </button>
                );
              })}
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
