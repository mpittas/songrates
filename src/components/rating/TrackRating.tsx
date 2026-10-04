"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type React from "react";
import { LuStar } from "react-icons/lu";
import { RiUserStarLine } from "react-icons/ri";

import Tooltip from "@/components/ui/Tooltip";
import { useRatingsContext } from "@/context/RatingsContext";
import { AlbumContext } from "@/types/music";
import { cn } from "@/lib/utils";
import { ratingColor } from "./constants";

export interface TrackRatingProps {
  trackId?: string;
  albumContext?: AlbumContext;
  displayRating?: number | null;
  publicRating?: number | null;
  onRate?: (rating: number) => void;
  showPublicRating?: boolean;
  readOnly?: boolean;
  /** Unrated circle on dark surfaces (mini player). */
  appearance?: "light" | "dark";
  /** Where the hover popover anchors relative to the circle. */
  popoverAlign?: "center" | "left";
}

const POPOVER_WIDTH = 228;
const VIEWPORT_MARGIN = 8;
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
  appearance = "light",
  popoverAlign = "center",
}: TrackRatingProps) {
  const [popoverMounted, setPopoverMounted] = useState(false);
  const [popoverEntering, setPopoverEntering] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0, arrowLeft: 0 });
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
    const anchorX = rect.left + rect.width / 2;
    const preferredLeft =
      popoverAlign === "left" ? rect.left : anchorX - POPOVER_WIDTH / 2;
    // Keep the whole panel on screen; the arrow still points at the trigger.
    const left = Math.min(
      Math.max(preferredLeft, VIEWPORT_MARGIN),
      window.innerWidth - POPOVER_WIDTH - VIEWPORT_MARGIN,
    );
    setPos({ top: rect.top - 8, left, arrowLeft: anchorX - left });
  }, [popoverAlign]);

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

  const isRated = Boolean(displayRating && displayRating > 0);
  const ratingBg = isRated
    ? ""
    : appearance === "dark"
      ? "bg-white/[0.06] ring-1 ring-inset ring-white/15 hover:bg-white/10"
      : "bg-transparent ring-1 ring-inset ring-line-strong hover:bg-ink/[0.05]";
  const publicRatingTooltip =
    publicRating && publicRating > 0
      ? "Average public rating from all users"
      : "No rating has been submitted for this song yet";

  return (
    <div className="relative flex items-center gap-0.5 sm:gap-2">
      {showPublicRating ? (
        <Tooltip content={publicRatingTooltip}>
          <span className="hidden h-8 items-center gap-1 rounded-full px-2 text-xs font-medium text-ink-3 tabular-nums transition-colors hover:bg-ink/[0.05] hover:text-ink-2 sm:flex">
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
            "flex size-8 cursor-pointer items-center justify-center rounded-full text-xs font-semibold tabular-nums transition-[background-color,transform] duration-150 hover:scale-105 active:scale-95",
            ratingBg,
            isRated
              ? "text-white shadow-[inset_0_-1px_0_rgb(0_0_0/0.15)]"
              : appearance === "dark"
                ? "text-white/50"
                : "text-ink-3 hover:text-ink",
          )}
          style={
            isRated
              ? { backgroundColor: ratingColor(displayRating!) }
              : undefined
          }
          aria-expanded={popoverMounted && popoverEntering}
          aria-label={
            isRated
              ? `Your rating: ${displayRating}. Change rating`
              : "Rate song"
          }
        >
          {displayRating && displayRating > 0 ? (
            displayRating
          ) : (
            <LuStar size={15} className="shrink-0" aria-hidden />
          )}
        </button>
      </div>

      {popoverMounted &&
        mounted &&
        createPortal(
          <div
            ref={panelRef}
            className="fixed z-[80]"
            style={{
              top: pos.top,
              left: pos.left,
              width: POPOVER_WIDTH,
              transform: "translate(0, -100%)",
            }}
            onMouseEnter={openPopover}
            onMouseLeave={scheduleClosePopover}
          >
            <div
              className={cn(
                "relative flex flex-col items-center justify-center rounded-2xl bg-[#1b1a19] p-3 shadow-pop ring-1 ring-white/10 transition-[opacity,transform] ease-out motion-reduce:transition-none",
                "origin-bottom",
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
              <div className="eyebrow mb-3 text-white/55">Rate this track</div>
              <div className="grid grid-cols-5 gap-2">
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
                    aria-label={`Rate ${n} out of 10`}
                    aria-pressed={displayRating === n}
                    style={
                      {
                        "--rating-color": ratingColor(n),
                      } as React.CSSProperties
                    }
                    className={cn(
                      "size-9 cursor-pointer rounded-full text-[13px] font-semibold tabular-nums text-white transition-[background-color,transform] duration-100 active:scale-90",
                      displayRating === n
                        ? "bg-(--rating-color) ring-2 ring-white/70"
                        : "bg-white/[0.08] text-white/90 hover:bg-(--rating-color) hover:text-white",
                    )}
                  >
                    {n}
                  </button>
                ))}
              </div>
              <div
                className="pointer-events-none absolute top-full -translate-x-1/2"
                style={{
                  left: Math.min(
                    Math.max(pos.arrowLeft, 18),
                    POPOVER_WIDTH - 18,
                  ),
                }}
                aria-hidden
              >
                <div className="h-0 w-0 border-x-[7px] border-t-[6px] border-x-transparent border-t-[#1b1a19]" />
              </div>
            </div>
            <div className="h-3" aria-hidden />
          </div>,
          document.body,
        )}
    </div>
  );
}
