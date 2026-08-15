import { useCallback, useEffect, useRef, useState } from "react";

import { cn, formatTime } from "@/lib/utils";
import { ProgressBarProps } from "@/types/player";

function clampPercent(clientX: number, rect: DOMRect) {
  return Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
}

export default function ProgressBar({
  currentTime,
  duration,
  buffered,
  onSeek,
  compact = false,
}: ProgressBarProps) {
  const progressRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragProgress, setDragProgress] = useState<number | null>(null);

  const seekFromClientX = useCallback(
    (clientX: number, commit: boolean) => {
      if (!progressRef.current || duration === 0) return;
      const percent = clampPercent(
        clientX,
        progressRef.current.getBoundingClientRect(),
      );
      setDragProgress(percent * 100);
      if (commit) {
        onSeek(percent * duration);
        setDragProgress(null);
      }
    },
    [duration, onSeek],
  );

  useEffect(() => {
    if (!isDragging) return;

    const handleMove = (e: MouseEvent) => {
      e.preventDefault();
      seekFromClientX(e.clientX, false);
    };
    const handleUp = (e: MouseEvent) => {
      seekFromClientX(e.clientX, true);
      setIsDragging(false);
    };

    window.addEventListener("mousemove", handleMove);
    window.addEventListener("mouseup", handleUp);
    return () => {
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseup", handleUp);
    };
  }, [isDragging, seekFromClientX]);

  const progress =
    dragProgress !== null
      ? dragProgress
      : duration > 0
        ? (currentTime / duration) * 100
        : 0;

  const slider = (
    <div
      ref={progressRef}
      role="slider"
      aria-label="Seek"
      aria-valuemin={0}
      aria-valuemax={Math.floor(duration)}
      aria-valuenow={Math.floor(currentTime)}
      tabIndex={0}
      className={cn(
        "group relative cursor-pointer select-none",
        compact ? "h-3 w-full" : "h-3 flex-1",
      )}
      onClick={(e) => seekFromClientX(e.clientX, true)}
      onMouseDown={(e) => {
        e.preventDefault();
        setIsDragging(true);
        seekFromClientX(e.clientX, false);
      }}
      onKeyDown={(e) => {
        if (duration === 0) return;
        if (e.key === "ArrowRight") onSeek(Math.min(duration, currentTime + 5));
        if (e.key === "ArrowLeft") onSeek(Math.max(0, currentTime - 5));
      }}
    >
      <div
        className={cn(
          "absolute left-0 right-0 overflow-hidden rounded-full bg-white/15",
          compact
            ? "top-0 h-[2px] group-hover:h-[3px]"
            : "top-1/2 h-[3px] -translate-y-1/2 group-hover:h-[5px]",
          "transition-[height] duration-150",
        )}
      >
        <div
          className="absolute inset-y-0 left-0 bg-white/20"
          style={{ width: `${(buffered || 0) * 100}%` }}
        />
        <div
          className="absolute inset-y-0 left-0 bg-white"
          style={{ width: `${progress}%` }}
        />
      </div>
      <div
        className={cn(
          "pointer-events-none absolute top-1/2 size-2.5 -translate-y-1/2 rounded-full bg-white shadow-[0_1px_4px_rgba(0,0,0,0.45)]",
          "scale-0 opacity-0 transition-transform duration-150",
          "group-hover:scale-100 group-hover:opacity-100 group-focus-visible:scale-100 group-focus-visible:opacity-100",
          isDragging && "scale-100 opacity-100",
        )}
        style={{ left: `calc(${progress}% - 5px)` }}
      />
    </div>
  );

  if (compact) return slider;

  return (
    <div className="flex w-full items-center gap-2.5">
      <span className="w-8 text-right text-[11px] tabular-nums text-white/40">
        {formatTime(currentTime, "seconds")}
      </span>
      {slider}
      <span className="w-8 text-[11px] tabular-nums text-white/40">
        {formatTime(duration, "seconds")}
      </span>
    </div>
  );
}
