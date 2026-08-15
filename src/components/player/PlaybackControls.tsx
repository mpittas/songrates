import {
  LuPause,
  LuPlay,
  LuRepeat,
  LuShuffle,
  LuSkipBack,
  LuSkipForward,
} from "react-icons/lu";

import { cn } from "@/lib/utils";
import { PlaybackControlsProps } from "@/types/player";

function ControlButton({
  label,
  disabled,
  active,
  onClick,
  children,
}: {
  label: string;
  disabled?: boolean;
  active?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className={cn(
        "flex size-8 items-center justify-center rounded-full transition-colors duration-150",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40",
        disabled
          ? "cursor-not-allowed text-white/20"
          : active
            ? "text-white"
            : "text-white/45 hover:text-white",
      )}
    >
      {children}
    </button>
  );
}

export default function PlaybackControls({
  isPlaying,
  isLoading,
  hasVideoId,
  onTogglePlay,
  onNext,
  onPrev,
  hasNext,
  hasPrev,
  isRepeating,
  onToggleRepeat,
  isShuffling,
  onToggleShuffle,
}: PlaybackControlsProps) {
  return (
    <div className="flex items-center gap-1 md:gap-1.5">
      <div className="hidden md:block">
        <ControlButton
          label="Shuffle"
          active={isShuffling}
          onClick={onToggleShuffle}
        >
          <LuShuffle size={15} strokeWidth={2} />
        </ControlButton>
      </div>

      <ControlButton
        label="Previous"
        disabled={!hasPrev}
        onClick={onPrev}
      >
        <LuSkipBack size={18} strokeWidth={2.2} />
      </ControlButton>

      <button
        type="button"
        onClick={onTogglePlay}
        disabled={isLoading || !hasVideoId}
        aria-label={isPlaying ? "Pause" : "Play"}
        className={cn(
          "mx-1 flex size-9 items-center justify-center rounded-full bg-white text-black",
          "transition-transform duration-150 hover:scale-105 active:scale-95",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50",
          "disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:scale-100",
        )}
      >
        {isLoading ? (
          <span className="size-3.5 animate-pulse rounded-full bg-black/25" />
        ) : isPlaying ? (
          <LuPause size={16} strokeWidth={2.4} />
        ) : (
          <LuPlay size={16} strokeWidth={2.4} className="ml-0.5" />
        )}
      </button>

      <ControlButton label="Next" disabled={!hasNext} onClick={onNext}>
        <LuSkipForward size={18} strokeWidth={2.2} />
      </ControlButton>

      <div className="hidden md:block">
        <ControlButton
          label="Repeat song"
          active={isRepeating}
          onClick={onToggleRepeat}
        >
          <LuRepeat size={15} strokeWidth={2} />
        </ControlButton>
      </div>
    </div>
  );
}
