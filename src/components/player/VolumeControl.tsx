import { useRef, useState, useEffect, useCallback } from "react";
import { FaVolumeUp, FaVolumeDown, FaVolumeMute } from "react-icons/fa";

import { VolumeControlProps } from "@/types/player";

export default function VolumeControl({
  volume,
  isMuted,
  onVolumeChange,
  onToggleMute,
}: VolumeControlProps) {
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const [isDraggingVolume, setIsDraggingVolume] = useState(false);
  const volumeSliderRef = useRef<HTMLDivElement>(null);

  const updateVolumeFromEvent = useCallback(
    (clientY: number) => {
      if (!volumeSliderRef.current) return;
      const rect = volumeSliderRef.current.getBoundingClientRect();
      const height = rect.height;
      const y = clientY - rect.top;
      // 0 at bottom, 1 at top
      const percent = Math.max(0, Math.min(1, 1 - y / height));
      const newVol = Math.round(percent * 100);

      onVolumeChange(newVol);
    },
    [onVolumeChange],
  );

  const handleVolumeDragStart = (e: React.MouseEvent<HTMLDivElement>) => {
    setIsDraggingVolume(true);
    updateVolumeFromEvent(e.clientY);
  };

  useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (isDraggingVolume) {
        e.preventDefault(); // Prevent selection
        updateVolumeFromEvent(e.clientY);
      }
    };

    const handleGlobalMouseUp = () => {
      if (isDraggingVolume) {
        setIsDraggingVolume(false);
      }
    };

    if (isDraggingVolume) {
      window.addEventListener("mousemove", handleGlobalMouseMove);
      window.addEventListener("mouseup", handleGlobalMouseUp);
    }
    return () => {
      window.removeEventListener("mousemove", handleGlobalMouseMove);
      window.removeEventListener("mouseup", handleGlobalMouseUp);
    };
  }, [isDraggingVolume, updateVolumeFromEvent]);

  return (
    <div
      className="relative group flex items-center justify-center"
      onMouseEnter={() => setShowVolumeSlider(true)}
      onMouseLeave={() => setShowVolumeSlider(false)}
    >
      <button
        onClick={onToggleMute}
        className="text-neutral-500 hover:text-white transition-colors p-2"
      >
        {isMuted || volume === 0 ? (
          <FaVolumeMute size={14} />
        ) : volume < 50 ? (
          <FaVolumeDown size={14} />
        ) : (
          <FaVolumeUp size={14} />
        )}
      </button>

      {/* Vertical Slider popup */}
      <div
        className={`absolute bottom-full left-1/2 -translate-x-1/2 w-10 h-40 bg-[#0a0a0d] border border-[#1a1a1f] shadow-xl flex items-end justify-center pb-4 z-50 transition-all duration-200 ease-out origin-bottom ${
          showVolumeSlider || isDraggingVolume
            ? "opacity-100 visible translate-y-0 scale-100"
            : "opacity-0 invisible translate-y-2 scale-95 pointer-events-none"
        }`}
      >
        <div
          ref={volumeSliderRef}
          className="w-2 h-32 bg-neutral-800 relative cursor-pointer group/slider py-2 select-none"
          onMouseDown={(e) => {
            e.preventDefault();
            handleVolumeDragStart(e);
          }}
        >
          <div
            className="absolute bottom-0 left-0 w-full bg-[#00f0ff]"
            style={{ height: `${isMuted ? 0 : volume}%` }}
          />
          {/* Knob */}
          <div
            className="absolute left-1/2 -translate-x-1/2 w-4 h-4 bg-white shadow-lg opacity-0 group-hover/slider:opacity-100 transition-opacity"
            style={{ bottom: `calc(${isMuted ? 0 : volume}% - 8px)` }}
          />
        </div>
      </div>
    </div>
  );
}
