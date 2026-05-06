"use client";

import { FaMinus, FaPlus } from "react-icons/fa6";
import { HiOutlineMicrophone } from "react-icons/hi2";

interface SongRowLyricsProps {
  isOpen: boolean;
  isLoading: boolean;
  lyrics?: string | null;
  fontSize: number;
  onIncreaseFontSize: () => void;
  onDecreaseFontSize: () => void;
  onClose: () => void;
}

export default function SongRowLyrics({
  isOpen,
  isLoading,
  lyrics,
  fontSize,
  onIncreaseFontSize,
  onDecreaseFontSize,
  onClose,
}: SongRowLyricsProps) {
  if (!isOpen) return null;

  return (
    <div className="px-4 pb-4 pt-3 bg-neutral-50 border-t border-neutral-100 mt-2 rounded-b-lg">
      <div className="flex items-center justify-between mb-4 pb-2 border-b border-neutral-200/50">
        <div className="flex items-center gap-2">
          <HiOutlineMicrophone size={14} className="text-neutral-500" />
          <span className="text-xs font-bold uppercase tracking-wider text-neutral-500 font-mono">
            Lyrics
          </span>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-neutral-200/50 rounded-lg p-0.5">
            <button
              onClick={onDecreaseFontSize}
              className="flex items-center justify-center w-6 h-6 rounded-md hover:bg-white hover:shadow-sm text-neutral-600 transition-all"
              title="Decrease font size"
            >
              <FaMinus size={10} />
            </button>
            <span className="text-[10px] font-bold text-neutral-600 font-mono w-7 text-center">
              {fontSize}px
            </span>
            <button
              onClick={onIncreaseFontSize}
              className="flex items-center justify-center w-6 h-6 rounded-md hover:bg-white hover:shadow-sm text-neutral-600 transition-all"
              title="Increase font size"
            >
              <FaPlus size={10} />
            </button>
          </div>

          <div className="w-px h-4 bg-neutral-300" />

          <button
            onClick={onClose}
            className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 hover:text-red-500 transition-colors font-mono"
          >
            Close
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center gap-2 py-4 justify-center">
          <div className="w-3 h-3 border-2 border-neutral-300 border-t-neutral-600 rounded-full animate-spin" />
          <span className="text-neutral-500 text-xs font-mono italic">
            Fetching words...
          </span>
        </div>
      ) : lyrics ? (
        <pre
          className="text-neutral-700 leading-relaxed font-sans whitespace-pre-wrap max-h-80 overflow-y-auto scrollbar-thin scrollbar-thumb-neutral-300 scrollbar-track-transparent pr-2"
          style={{ fontSize: `${fontSize}px` }}
        >
          {lyrics}
        </pre>
      ) : (
        <p className="text-neutral-500 text-xs font-mono py-2 text-center italic">
          No lyrics found for this track
        </p>
      )}
    </div>
  );
}
