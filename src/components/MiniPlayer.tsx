"use client";

import { usePlayer } from "@/context/PlayerContext";
import { FaPlay, FaPause, FaTimes } from "react-icons/fa";
import { useEffect, useRef, useState, useCallback } from "react";

export default function MiniPlayer() {
  const {
    currentTrack,
    videoId,
    isPlaying,
    isLoading,
    currentTime,
    duration,
    stopPlayback,
    togglePlayPause,
    seekTo,
    setPlayerRef,
    updateProgress,
  } = usePlayer();
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const [showVideo, setShowVideo] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  // Register iframe ref with context
  useEffect(() => {
    setPlayerRef(iframeRef.current);
  }, [iframeRef.current, setPlayerRef]);

  // Control YouTube player via postMessage
  useEffect(() => {
    if (iframeRef.current && videoId) {
      const command = isPlaying ? "playVideo" : "pauseVideo";
      iframeRef.current.contentWindow?.postMessage(
        JSON.stringify({ event: "command", func: command }),
        "*",
      );
    }
  }, [isPlaying, videoId]);

  // Poll for current time from YouTube player
  useEffect(() => {
    if (!videoId || !isPlaying) return;

    const interval = setInterval(() => {
      if (iframeRef.current) {
        // Request current time and duration
        iframeRef.current.contentWindow?.postMessage(
          JSON.stringify({ event: "listening" }),
          "*",
        );
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [videoId, isPlaying]);

  // Listen for YouTube player messages
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== "https://www.youtube.com") return;

      try {
        const data = JSON.parse(event.data);
        if (data.event === "infoDelivery" && data.info) {
          if (
            typeof data.info.currentTime === "number" &&
            typeof data.info.duration === "number"
          ) {
            updateProgress(data.info.currentTime, data.info.duration);
          }
        }
      } catch {
        // Not a JSON message, ignore
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [updateProgress]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleProgressClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!progressRef.current || duration === 0) return;
      const rect = progressRef.current.getBoundingClientRect();
      const percent = (e.clientX - rect.left) / rect.width;
      const newTime = percent * duration;
      seekTo(newTime);
    },
    [duration, seekTo],
  );

  const handleProgressDrag = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!isDragging || !progressRef.current || duration === 0) return;
      const rect = progressRef.current.getBoundingClientRect();
      const percent = Math.max(
        0,
        Math.min(1, (e.clientX - rect.left) / rect.width),
      );
      const newTime = percent * duration;
      seekTo(newTime);
    },
    [isDragging, duration, seekTo],
  );

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  if (!currentTrack) return null;

  return (
    <>
      {/* Single persistent iframe - always rendered, visually hidden when not showing video */}
      {videoId && (
        <div
          className={`fixed z-50 shadow-2xl border border-[#1a1a1f] bg-black transition-all duration-300 ${
            showVideo
              ? "bottom-24 right-4 opacity-100"
              : "bottom-[-500px] right-4 opacity-0 pointer-events-none"
          }`}
        >
          {/* Video Header */}
          <div className="flex items-center justify-between px-3 py-2 bg-[#0a0a0d] border-b border-[#1a1a1f]">
            <span className="text-[10px] text-neutral-500 font-mono truncate max-w-[200px]">
              {currentTrack.title}
            </span>
            <button
              onClick={() => setShowVideo(false)}
              className="text-neutral-500 hover:text-white transition-colors ml-2"
            >
              <FaTimes size={10} />
            </button>
          </div>
          {/* Video Player */}
          <div
            onMouseLeave={() => {
              // Remove focus from iframe when mouse leaves to prevent navigation capture
              if (document.activeElement instanceof HTMLIFrameElement) {
                (document.activeElement as HTMLElement).blur();
              }
            }}
          >
            <iframe
              ref={iframeRef}
              src={`https://www.youtube.com/embed/${videoId}?autoplay=1&enablejsapi=1&origin=${typeof window !== "undefined" ? window.location.origin : ""}`}
              className="w-80 h-48"
              allow="autoplay; encrypted-media"
              allowFullScreen
              tabIndex={-1}
            />
          </div>
        </div>
      )}

      {/* Bottom Mini Player Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-[#1a1a1f] bg-[#050507]/95 backdrop-blur-sm">
        {/* Progress Bar */}
        <div
          ref={progressRef}
          className="h-1 bg-[#1a1a1f] cursor-pointer group"
          onClick={handleProgressClick}
          onMouseDown={() => setIsDragging(true)}
          onMouseUp={() => setIsDragging(false)}
          onMouseLeave={() => setIsDragging(false)}
          onMouseMove={handleProgressDrag}
        >
          <div
            className="h-full bg-[#00f0ff] relative transition-all"
            style={{ width: `${progress}%` }}
          >
            {/* Draggable dot */}
            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-[#00f0ff] opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 py-2 flex items-center justify-between gap-4">
          {/* Track Info */}
          <div className="flex items-center gap-4 min-w-0 flex-1">
            <button
              onClick={togglePlayPause}
              disabled={isLoading || !videoId}
              className="w-10 h-10 flex items-center justify-center bg-[#00f0ff] text-[#050507] shrink-0 hover:bg-[#00f0ff]/80 transition-colors disabled:opacity-50"
            >
              {isLoading ? (
                <span className="animate-pulse text-xs">...</span>
              ) : isPlaying ? (
                <FaPause size={14} />
              ) : (
                <FaPlay size={14} className="ml-0.5" />
              )}
            </button>

            <div className="min-w-0 flex-1">
              <p className="text-sm text-neutral-200 truncate">
                {currentTrack.title}
              </p>
              <div className="flex items-center gap-2">
                <p className="text-xs text-neutral-500 truncate">
                  {currentTrack.artistName}
                </p>
                {duration > 0 && (
                  <span className="text-[10px] text-neutral-600 font-mono">
                    {formatTime(currentTime)} / {formatTime(duration)}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-2">
            {/* Video Button */}
            <button
              onClick={() => setShowVideo(!showVideo)}
              className={`text-[10px] font-mono px-2 py-1 border transition-colors ${
                showVideo
                  ? "border-[#00f0ff] text-[#00f0ff] bg-[#00f0ff]/10"
                  : "border-[#1a1a1f] text-neutral-600 hover:border-[#00f0ff]/50 hover:text-neutral-400"
              }`}
            >
              {showVideo ? "hide" : "video"}
            </button>
            {/* YouTube Link */}
            <a
              href={`https://www.youtube.com/results?search_query=${encodeURIComponent(currentTrack.artistName + " " + currentTrack.title)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[10px] font-mono px-2 py-1 border border-[#1a1a1f] text-neutral-600 hover:border-[#00f0ff]/50 hover:text-neutral-400 transition-colors"
            >
              youtube ↗
            </a>
            {/* Close Button */}
            <button
              onClick={stopPlayback}
              className="w-8 h-8 flex items-center justify-center text-neutral-500 hover:text-neutral-200 transition-colors"
            >
              <FaTimes size={14} />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
