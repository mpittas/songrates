import { useCallback, useEffect, useRef, useState } from "react";
import { LuVolume1, LuVolume2, LuVolumeX } from "react-icons/lu";

import { cn } from "@/lib/utils";
import { VolumeControlProps } from "@/types/player";

function clampPercent(clientX: number, rect: DOMRect) {
  return Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
}

export default function VolumeControl({
  volume,
  isMuted,
  onVolumeChange,
  onToggleMute,
}: VolumeControlProps) {
  const sliderRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const setFromClientX = useCallback(
    (clientX: number) => {
      if (!sliderRef.current) return;
      const percent = clampPercent(
        clientX,
        sliderRef.current.getBoundingClientRect(),
      );
      onVolumeChange(Math.round(percent * 100));
    },
    [onVolumeChange],
  );

  useEffect(() => {
    if (!isDragging) return;

    const handleMove = (e: MouseEvent) => {
      e.preventDefault();
      setFromClientX(e.clientX);
    };
    const handleUp = () => setIsDragging(false);

    window.addEventListener("mousemove", handleMove);
    window.addEventListener("mouseup", handleUp);
    return () => {
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseup", handleUp);
    };
  }, [isDragging, setFromClientX]);

  const level = isMuted ? 0 : volume;
  const VolumeIcon =
    isMuted || volume === 0 ? LuVolumeX : volume < 50 ? LuVolume1 : LuVolume2;

  return (
    <div className="group/volume flex items-center gap-1.5">
      <button
        type="button"
        onClick={onToggleMute}
        aria-label={isMuted ? "Unmute" : "Mute"}
        className="flex size-8 items-center justify-center rounded-full text-white/45 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
      >
        <VolumeIcon size={16} strokeWidth={2} />
      </button>

      <div
        ref={sliderRef}
        role="slider"
        aria-label="Volume"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={level}
        tabIndex={0}
        className="relative h-3 w-20 cursor-pointer select-none"
        onClick={(e) => setFromClientX(e.clientX)}
        onMouseDown={(e) => {
          e.preventDefault();
          setIsDragging(true);
          setFromClientX(e.clientX);
        }}
        onKeyDown={(e) => {
          if (e.key === "ArrowRight") onVolumeChange(Math.min(100, volume + 5));
          if (e.key === "ArrowLeft") onVolumeChange(Math.max(0, volume - 5));
        }}
      >
        <div
          className={cn(
            "absolute top-1/2 left-0 right-0 h-[3px] -translate-y-1/2 overflow-hidden rounded-full bg-white/15",
            "transition-[height] duration-150 group-hover/volume:h-[5px]",
          )}
        >
          <div
            className="absolute inset-y-0 left-0 bg-white"
            style={{ width: `${level}%` }}
          />
        </div>
        <div
          className={cn(
            "pointer-events-none absolute top-1/2 size-2.5 -translate-y-1/2 rounded-full bg-white shadow-[0_1px_4px_rgba(0,0,0,0.45)]",
            "scale-0 opacity-0 transition-transform duration-150",
            "group-hover/volume:scale-100 group-hover/volume:opacity-100",
            isDragging && "scale-100 opacity-100",
          )}
          style={{ left: `calc(${level}% - 5px)` }}
        />
      </div>
    </div>
  );
}
