"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { LuStar } from "react-icons/lu";
import { RiUserStarLine } from "react-icons/ri";

import Tooltip from "@/components/ui/Tooltip";
import { useRatingsContext } from "@/context/RatingsContext";
import { AlbumContext } from "@/types/music";
import { cn } from "@/lib/utils";

export interface TrackRatingProps {
  trackId?: string;
  albumContext?: AlbumContext;
  displayRating?: number | null;
  publicRating?: number | null;
  onRate?: (rating: number) => void;
  showPublicRating?: boolean;
  readOnly?: boolean;
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

export default function TrackRating({
  trackId,
  albumContext,
  displayRating,
  publicRating,
  onRate,
  showPublicRating = true,
  readOnly = false,
}: TrackRatingProps) {
  const [popoverMounted, setPopoverMounted] = useState(false);
  const [popoverEntering, setPopoverEntering] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
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

  const updatePos = useCallback(() => {
    const trigger = triggerRef.current;
    if (!trigger) return;
    const rect = trigger.getBoundingClientRect();
    setPos({
      top: rect.top - 8,
      left: rect.left + rect.width / 2,
    });
  }, []);

  const openPopover = () => {
    if (readOnly) return;
    clearPendingPopoverWork();
    updatePos();
    setPopoverMounted(true);
    enterFrameRef.current = requestAnimationFrame(() => {
      enterNextFrameRef.current = requestAnimationFrame(() => {
        setPopoverEntering(true);
        enterFrameRef.current = null;
        enterNextFrameRef.current = null;
      });
    });
  };

  const dismissPopover = useCallback(
    (immediate: boolean) => {
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
    },
    [clearPendingPopoverWork],
  );

  const scheduleClosePopover = () => dismissPopover(false);

  useEffect(() => {
    setMounted(true);
    return () => clearPendingPopoverWork();
  }, [clearPendingPopoverWork]);

  useEffect(() => {
    if (!popoverMounted) return;
    updatePos();
    window.addEventListener("scroll", updatePos, true);
    window.addEventListener("resize", updatePos);
    return () => {
      window.removeEventListener("scroll", updatePos, true);
      window.removeEventListener("resize", updatePos);
    };
  }, [popoverMounted, updatePos]);

  useEffect(() => {
    if (!popoverMounted) return;

    function handleClickOutside(e: MouseEvent) {
      const target = e.target as Node;
      if (triggerRef.current?.contains(target)) return;
      if (panelRef.current?.contains(target)) return;
      dismissPopover(true);
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [dismissPopover, popoverMounted]);

  const ratingBg =
    displayRating && displayRating > 0
      ? ratingColors[displayRating]
      : "bg-neutral-200";
  const publicRatingTooltip =
    publicRating && publicRating > 0
      ? "Average public rating from all users"
      : "No rating has been submitted for this song yet";

  return (
    <div className="relative flex items-center gap-0.5 sm:gap-2">
      {showPublicRating ? (
        <Tooltip content={publicRatingTooltip}>
          <span className="hidden items-center gap-1 rounded-md px-1.5 py-1 text-xs font-medium text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-600 sm:flex">
            <RiUserStarLine size={14} />
            {publicRating && publicRating > 0 ? publicRating.toFixed(1) : "−"}
          </span>
        </Tooltip>
      ) : null}

      <div
        ref={triggerRef}
        className="relative"
        onMouseEnter={openPopover}
        onMouseLeave={scheduleClosePopover}
      >
        <button
          type="button"
          onClick={() => openPopover()}
          className={cn(
            "flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-semibold transition-all hover:scale-105 sm:h-8 sm:w-8 sm:text-xs",
            ratingBg,
            displayRating && displayRating > 0
              ? "text-white"
              : "text-neutral-400",
          )}
          aria-expanded={popoverMounted && popoverEntering}
          aria-label="Rate song"
        >
          {displayRating && displayRating > 0 ? (
            displayRating
          ) : (
            <>
              <LuStar size={12} className="shrink-0 sm:hidden" aria-hidden />
              <LuStar
                size={16}
                className="hidden shrink-0 sm:block"
                aria-hidden
              />
            </>
          )}
        </button>
      </div>

      {popoverMounted &&
        mounted &&
        createPortal(
          <div
            ref={panelRef}
            className="fixed z-[80] w-[220px]"
            style={{
              top: pos.top,
              left: pos.left,
              transform: "translate(-50%, -100%)",
            }}
            onMouseEnter={openPopover}
            onMouseLeave={scheduleClosePopover}
          >
            <div
              className={cn(
                "relative flex flex-col items-center justify-center rounded-2xl bg-neutral-800 p-3 shadow-2xl/15 origin-bottom transition-[opacity,transform] ease-out motion-reduce:transition-none",
                popoverEntering
                  ? "pointer-events-auto translate-y-0 scale-100 opacity-100"
                  : "pointer-events-none translate-y-1 scale-[0.96] opacity-0",
              )}
              style={{
                transitionDuration: `${
                  popoverEntering ? POPOVER_ENTER_MS : POPOVER_EXIT_MS
                }ms`,
              }}
            >
              <div className="mb-3 text-xs font-medium uppercase text-neutral-300">
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
                      dismissPopover(true);
                    }}
                    className={cn(
                      "h-8 w-8 rounded-full text-xs font-bold transition-all",
                      displayRating === n
                        ? `${ratingColors[n]} text-white`
                        : "bg-neutral-700 text-neutral-100 hover:bg-neutral-400/60",
                    )}
                  >
                    {n}
                  </button>
                ))}
              </div>
              <div
                className="pointer-events-none absolute top-full left-1/2 -translate-x-1/2"
                aria-hidden
              >
                <div className="h-0 w-0 border-x-[7px] border-t-[6px] border-x-transparent border-t-neutral-800" />
              </div>
            </div>
            <div className="h-3" aria-hidden />
          </div>,
          document.body,
        )}
    </div>
  );
}
