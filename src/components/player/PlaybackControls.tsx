import { FaPlay, FaPause, FaStepBackward, FaStepForward } from "react-icons/fa";

import { PlaybackControlsProps } from "@/types/player";

export default function PlaybackControls({
  isPlaying,
  isLoading,
  hasVideoId,
  onTogglePlay,
}: PlaybackControlsProps) {
  return (
    <div className="flex items-center gap-4">
      <button
        disabled
        className="text-neutral-600 cursor-not-allowed hover:text-neutral-600"
      >
        <FaStepBackward size={14} />
      </button>

      <button
        onClick={onTogglePlay}
        disabled={isLoading || !hasVideoId}
        className="w-8 h-8 flex items-center justify-center bg-[#00f0ff] text-[#050507] rounded-full hover:bg-[#00f0ff]/80 transition-colors disabled:opacity-50"
      >
        {isLoading ? (
          <span className="animate-pulse text-[8px]">...</span>
        ) : isPlaying ? (
          <FaPause size={10} />
        ) : (
          <FaPlay size={10} className="ml-0.5" />
        )}
      </button>

      <button
        disabled
        className="text-neutral-600 cursor-not-allowed hover:text-neutral-600"
      >
        <FaStepForward size={14} />
      </button>
    </div>
  );
}
