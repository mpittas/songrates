import { useRef, useState, useEffect, useCallback } from "react";
import { formatTime } from "@/lib/utils";

import { ProgressBarProps } from "@/types/player";

export default function ProgressBar({
  currentTime,
  duration,
  buffered,
  onSeek,
}: ProgressBarProps) {
  const progressRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragProgress, setDragProgress] = useState<number | null>(null);

  const handleProgressClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!progressRef.current || duration === 0) return;
      const rect = progressRef.current.getBoundingClientRect();
      const percent = (e.clientX - rect.left) / rect.width;
      const newTime = percent * duration;
      onSeek(newTime);
      setDragProgress(null);
    },
    [duration, onSeek],
  );

  const handleProgressDrag = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!isDragging || !progressRef.current || duration === 0) return;
      const rect = progressRef.current.getBoundingClientRect();
      const percent = Math.max(
        0,
        Math.min(1, (e.clientX - rect.left) / rect.width),
      );
      setDragProgress(percent * 100);
    },
    [isDragging, duration],
  );

  const handleDragStart = () => {
    setIsDragging(true);
  };

  const handleDragEnd = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!isDragging) return;
      setIsDragging(false);

      if (dragProgress !== null && duration > 0) {
        const newTime = (dragProgress / 100) * duration;
        onSeek(newTime);
      }
      setDragProgress(null);
    },
    [isDragging, dragProgress, duration, onSeek],
  );

  useEffect(() => {
    const handleGlobalMouseUp = () => {
      if (isDragging) {
        setIsDragging(false);
        if (dragProgress !== null && duration > 0) {
          const newTime = (dragProgress / 100) * duration;
          onSeek(newTime);
        }
        setDragProgress(null);
      }
    };

    if (isDragging) {
      window.addEventListener("mouseup", handleGlobalMouseUp);
    }
    return () => {
      window.removeEventListener("mouseup", handleGlobalMouseUp);
    };
  }, [isDragging, dragProgress, duration, onSeek]);

  const progress =
    dragProgress !== null
      ? dragProgress
      : duration > 0
        ? (currentTime / duration) * 100
        : 0;

  return (
    <div className="flex items-center gap-3 flex-1 max-w-lg">
      <span className="text-[10px] text-neutral-500 font-mono w-8 text-right">
        {formatTime(currentTime, "seconds")}
      </span>

      <div
        ref={progressRef}
        className="flex-1 h-1 bg-[#1a1a1f] cursor-pointer group relative rounded-full overflow-visible select-none"
        onClick={handleProgressClick}
        onMouseDown={handleDragStart}
        onMouseMove={handleProgressDrag}
        onMouseUp={handleDragEnd}
      >
        <div
          className="absolute top-0 left-0 h-full bg-neutral-600 transition-all duration-300"
          style={{ width: `${(buffered || 0) * 100}%` }}
        />

        <div
          className="absolute top-0 left-0 h-full bg-[#00f0ff] relative"
          style={{ width: `${progress}%` }}
        >
          <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-md scale-0 group-hover:scale-100 transition-transform duration-100 opacity-100 scale-100" />
        </div>
      </div>

      <span className="text-[10px] text-neutral-500 font-mono w-8">
        {formatTime(duration, "seconds")}
      </span>
    </div>
  );
}
