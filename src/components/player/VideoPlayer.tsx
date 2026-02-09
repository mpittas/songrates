"use client";

import dynamic from "next/dynamic";
import { FaTimes } from "react-icons/fa";

import { VideoPlayerProps } from "@/types/player";

const YouTube = dynamic(
  () => import("react-youtube").then((mod) => mod.default),
  {
    ssr: false,
    loading: () => <div className="w-full h-full bg-black" />,
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
      className={`fixed z-50 shadow-2xl border border-[#1a1a1f] bg-black transition-all duration-300 ${
        showVideo && videoId
          ? "bottom-24 right-4 opacity-100 scale-100"
          : "bottom-[-500px] right-4 opacity-0 scale-95 pointer-events-none"
      }`}
    >
      {/* Video Header */}
      <div className="flex items-center justify-between px-3 py-2 bg-[#0a0a0d] border-b border-[#1a1a1f]">
        <span className="text-[10px] text-neutral-500 font-mono truncate max-w-[200px]">
          {title}
        </span>
        <button
          onClick={onClose}
          className="text-neutral-500 hover:text-white transition-colors ml-2"
        >
          <FaTimes size={10} />
        </button>
      </div>
      {/* Video Player */}
      <div className="w-80 h-48 bg-black relative">
        <YouTube
          videoId={videoId}
          opts={opts}
          onReady={onReady}
          onStateChange={onStateChange}
          className="absolute inset-0 w-full h-full"
          iframeClassName="w-full h-full"
        />
      </div>
    </div>
  );
}
