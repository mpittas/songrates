"use client";

import dynamic from "next/dynamic";
import { LuX } from "react-icons/lu";

import { VideoPlayerProps } from "@/types/player";

const YouTube = dynamic(
  () => import("react-youtube").then((mod) => mod.default),
  {
    ssr: false,
    loading: () => <div className="size-full bg-black" />,
  },
);

export default function VideoPlayer({
  videoId,
  title,
  showVideo,
  onClose,
  onReady,
  onStateChange,
  opts,
}: VideoPlayerProps) {
  return (
    <div
      className={`fixed z-50 overflow-hidden rounded-xl border border-white/10 bg-black shadow-[0_20px_50px_rgba(0,0,0,0.5)] transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
        showVideo && videoId
          ? "right-4 bottom-24 opacity-100 scale-100"
          : "pointer-events-none right-4 bottom-[-500px] scale-95 opacity-0"
      }`}
    >
      <div className="flex items-center justify-between bg-[#0a0a0a] px-3 py-2">
        <span className="max-w-[200px] truncate text-[11px] text-white/50">
          {title}
        </span>
        <button
          type="button"
          onClick={onClose}
          className="ml-2 flex size-6 items-center justify-center rounded-full text-white/40 transition-colors hover:text-white"
          aria-label="Close video"
        >
          <LuX size={12} strokeWidth={2} />
        </button>
      </div>
      <div className="relative h-48 w-80 bg-black">
        <YouTube
          videoId={videoId}
          opts={opts}
          onReady={onReady}
          onStateChange={onStateChange}
          className="absolute inset-0 size-full"
          iframeClassName="w-full h-full"
        />
      </div>
    </div>
  );
}
