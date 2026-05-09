"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { LuStar } from "react-icons/lu";
import { RiUserStarLine } from "react-icons/ri";

import Tooltip from "@/components/ui/Tooltip";
import { useRatingsContext } from "@/context/RatingsContext";
import { AlbumContext } from "@/types/music";

interface SongRowRatingProps {
  trackId?: string;
  albumContext?: AlbumContext;
  displayRating?: number | null;
  publicRating?: number | null;
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

const POPOVER_LEAVE_MS = 40;
const POPOVER_ENTER_MS = 120;
const POPOVER_EXIT_MS = 75;

export default function SongRowRating({
  trackId,
  albumContext,
  displayRating,
  publicRating,
  onRate,
}: SongRowRatingProps) {
  const [popoverMounted, setPopoverMounted] = useState(false);
  const [popoverEntering, setPopoverEntering] = useState(false);
  const ratingRef = useRef<HTMLDivElement>(null);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const unmountTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const enterFrameRef = useRef<number | null>(null);
  const enterNextFrameRef = useRef<number | null>(null);
  const { setRating } = useRatingsContext();

  const clearCloseTimer = useCallback(() => {
    if (closeTimerRef.current != null) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  }, []);

  const clearUnmountTimer = useCallback(() => {
    if (unmountTimerRef.current != null) {
      clearTimeout(unmountTimerRef.current);
      unmountTimerRef.current = null;
    }
  }, []);

  const clearEnterFrames = useCallback(() => {
    if (enterFrameRef.current != null) {
      cancelAnimationFrame(enterFrameRef.current);
      enterFrameRef.current = null;
    }
    if (enterNextFrameRef.current != null) {
      cancelAnimationFrame(enterNextFrameRef.current);
      enterNextFrameRef.current = null;
    }
  }, []);

  const clearPendingPopoverWork = useCallback(() => {
    clearCloseTimer();
    clearUnmountTimer();
    clearEnterFrames();
  }, [clearCloseTimer, clearUnmountTimer, clearEnterFrames]);

  const openPopover = () => {
    clearPendingPopoverWork();
    setPopoverMounted(true);
    enterFrameRef.current = requestAnimationFrame(() => {
      enterNextFrameRef.current = requestAnimationFrame(() => {
        setPopoverEntering(true);
        enterFrameRef.current = null;
        enterNextFrameRef.current = null;
      });
    });
  };

  const dismissPopover = useCallback((immediate: boolean) => {
    clearPendingPopoverWork();
    const beginExit = () => {
      setPopoverEntering(false);
      unmountTimerRef.current = setTimeout(() => {
        setPopoverMounted(false);
        unmountTimerRef.current = null;
      }, POPOVER_EXIT_MS);
    };
    if (immediate) {
      beginExit();
    } else {
      closeTimerRef.current = setTimeout(beginExit, POPOVER_LEAVE_MS);
    }
  }, [clearPendingPopoverWork]);

  const scheduleClosePopover = () => dismissPopover(false);

  useEffect(() => {
    return () => clearPendingPopoverWork();
  }, [clearPendingPopoverWork]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ratingRef.current && !ratingRef.current.contains(e.target as Node)) {
        dismissPopover(true);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [dismissPopover]);

  const ratingBg =
    displayRating && displayRating > 0
      ? ratingColors[displayRating]
      : "bg-neutral-200";
  const publicRatingTooltip =
    publicRating && publicRating > 0
      ? "Average public rating from all users"
      : "No rating has been submitted for this song yet";

  return (
    <div className="relative flex items-center gap-2" ref={ratingRef}>
      <Tooltip content={publicRatingTooltip}>
        <span className="flex items-center gap-1 rounded-md px-1.5 py-1 text-xs font-medium text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-600">
          <RiUserStarLine size={14} />
          {publicRating && publicRating > 0 ? publicRating.toFixed(1) : "−"}
        </span>
      </Tooltip>
      <div
        className="relative"
        onMouseEnter={openPopover}
        onMouseLeave={scheduleClosePopover}
      >
        <button
          type="button"
          onClick={() => openPopover()}
          className={`w-8 h-8 rounded-full ${ratingBg} flex items-center justify-center text-xs font-semibold transition-all hover:scale-105 ${
            displayRating && displayRating > 0
              ? "text-white"
              : "text-neutral-400"
          }`}
          aria-expanded={popoverMounted && popoverEntering}
          aria-label="Rate song"
        >
          {displayRating && displayRating > 0 ? (
            displayRating
          ) : (
            <LuStar size={16} className="shrink-0" aria-hidden />
          )}
        </button>

        {popoverMounted && (
          <div
            className="absolute bottom-[calc(100%-5px)] left-1/2 z-50 w-[220px] -translate-x-1/2 pb-4"
            onMouseEnter={openPopover}
            onMouseLeave={scheduleClosePopover}
          >
            <div
              className={`relative rounded-2xl bg-neutral-800 p-3 flex flex-col items-center justify-center shadow-2xl/15 origin-bottom transition-[opacity,transform] ease-out motion-reduce:transition-none ${
                popoverEntering
                  ? "pointer-events-auto opacity-100 translate-y-0 scale-100"
                  : "pointer-events-none opacity-0 translate-y-1 scale-[0.96]"
              }`}
              style={{
                transitionDuration: `${
                  popoverEntering ? POPOVER_ENTER_MS : POPOVER_EXIT_MS
                }ms`,
              }}
            >
              <div className="text-xs font-medium uppercase text-neutral-300 mb-3">
                Rate this track
              </div>
              <div className="grid grid-cols-5 gap-1.5">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => {
                      const nextRating = displayRating === n ? 0 : n;
                      if (trackId) {
                        setRating(trackId, nextRating, albumContext);
                      }
                      onRate?.(nextRating);
                    }}
                    className={`w-8 h-8 rounded-full text-xs line-height-7 font-bold transition-all ${
                      displayRating === n
                        ? `${ratingColors[n]} text-white`
                        : "bg-neutral-700 text-neutral-100 hover:bg-neutral-400/60"
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
              <div
                className="pointer-events-none absolute left-1/2 top-full -translate-x-1/2"
                aria-hidden
              >
                <div className="h-0 w-0 border-x-[7px] border-t-[6px] border-x-transparent border-t-neutral-800" />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
