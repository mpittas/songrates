"use client";

import Link from "next/link";
import { usePlayer } from "@/context/PlayerContext";
import {
  FaPlay,
  FaPause,
  FaTimes,
  FaStepBackward,
  FaStepForward,
  FaVolumeUp,
  FaVolumeDown,
  FaVolumeMute,
  FaVolumeOff,
} from "react-icons/fa";
import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import YouTube, { YouTubeProps } from "react-youtube";

export default function MiniPlayer() {
  const {
    currentTrack,
    videoId,
    isPlaying,
    isLoading,
    currentTime,
    duration,
    buffered,
    stopPlayback,
    pausePlayback,
    togglePlayPause,
    seekTo,
    setPlayerRef,
    updateProgress,
  } = usePlayer();
  const playerRef = useRef<any>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const [showVideo, setShowVideo] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragProgress, setDragProgress] = useState<number | null>(null);
  const [volume, setVolume] = useState(100);
  const [isDraggingVolume, setIsDraggingVolume] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const volumeSliderRef = useRef<HTMLDivElement>(null);

  // Poll for current time
  useEffect(() => {
    if (!videoId || !isPlaying) return;

    const interval = setInterval(() => {
      // Check if player is available and has methods
      if (
        playerRef.current &&
        typeof playerRef.current.getCurrentTime === "function"
      ) {
        const time = playerRef.current.getCurrentTime();
        const duration = playerRef.current.getDuration();
        const loaded = playerRef.current.getVideoLoadedFraction(); // 0 to 1
        updateProgress(time, duration, loaded);
      }
    }, 100);

    return () => clearInterval(interval);
  }, [videoId, isPlaying, updateProgress]);

  const onPlayerReady: YouTubeProps["onReady"] = useCallback(
    (event: any) => {
      playerRef.current = event.target;
      setPlayerRef(event.target);
      if (isPlaying) {
        event.target.playVideo();
      }
    },
    [isPlaying, setPlayerRef],
  );

  const onStateChange: YouTubeProps["onStateChange"] = useCallback(
    (event: any) => {
      // 0 = ended
      if (event.data === 0) {
        pausePlayback();
      }
      // 1 = playing, 2 = paused. Context handles toggle, so we just let it sync via polling/interval or manual toggle.
    },
    [pausePlayback],
  );

  const updateVolumeFromEvent = useCallback(
    (clientY: number) => {
      if (!volumeSliderRef.current || !playerRef.current) return;
      const rect = volumeSliderRef.current.getBoundingClientRect();
      const height = rect.height;
      const y = clientY - rect.top;
      // 0 at bottom, 1 at top
      const percent = Math.max(0, Math.min(1, 1 - y / height));
      const newVol = Math.round(percent * 100);

      setVolume(newVol);
      if (newVol > 0 && isMuted) setIsMuted(false);

      if (
        playerRef.current &&
        typeof playerRef.current.setVolume === "function"
      ) {
        playerRef.current.setVolume(newVol);
        if (isMuted) playerRef.current.unMute();
      }
    },
    [isMuted],
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

  const toggleMute = () => {
    if (!playerRef.current) return;
    if (isMuted) {
      playerRef.current.unMute();
      setIsMuted(false);
    } else {
      playerRef.current.mute();
      setIsMuted(true);
    }
  };

  const opts: YouTubeProps["opts"] = useMemo(
    () => ({
      height: "100%",
      width: "100%",
      playerVars: {
        autoplay: 1,
        controls: 0,
        origin:
          typeof window !== "undefined" ? window.location.origin : undefined,
      },
    }),
    [],
  );

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
      setDragProgress(null); // Clear drag state just in case
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
        seekTo(newTime);
      }
      setDragProgress(null);
    },
    [isDragging, dragProgress, duration, seekTo],
  );

  // Global mouse up to catch release outside component
  useEffect(() => {
    const handleGlobalMouseUp = () => {
      if (isDragging) {
        setIsDragging(false);
        if (dragProgress !== null && duration > 0) {
          const newTime = (dragProgress / 100) * duration;
          seekTo(newTime);
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
  }, [isDragging, dragProgress, duration, seekTo]);

  const progress =
    dragProgress !== null
      ? dragProgress
      : duration > 0
        ? (currentTime / duration) * 100
        : 0;

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
          <div className="w-80 h-48 bg-black relative">
            <YouTube
              videoId={videoId}
              opts={opts}
              onReady={onPlayerReady}
              onStateChange={onStateChange}
              className="absolute inset-0 w-full h-full"
              iframeClassName="w-full h-full"
            />
          </div>
        </div>
      )}

      {/* Bottom Mini Player Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-[#1a1a1f] bg-[#050507]/95 backdrop-blur-sm">
        <div className="flex items-center justify-between gap-6 px-4 py-3 w-full">
          {/* Left: Track Info */}
          <div className="flex items-center gap-4 min-w-[200px] w-1/4">
            {/* Album Art */}
            {currentTrack.albumImageUrl && (
              <Link
                href={
                  currentTrack.artistId
                    ? `/artist/${currentTrack.artistId}`
                    : "#"
                }
                className="w-10 h-10 relative shrink-0 border border-[#1a1a1f] hover:border-[#00f0ff] transition-colors overflow-hidden group/image"
              >
                <img
                  src={currentTrack.albumImageUrl}
                  alt={currentTrack.artistName}
                  className="w-full h-full object-cover grayscale group-hover/image:grayscale-0 transition-all"
                />
              </Link>
            )}

            <div className="min-w-0 flex flex-col justify-center">
              <Link
                href={
                  currentTrack.albumId ? `/album/${currentTrack.albumId}` : "#"
                }
                className="text-sm text-neutral-200 truncate hover:text-[#00f0ff] transition-colors block"
              >
                {currentTrack.title}
              </Link>
              <Link
                href={
                  currentTrack.artistId
                    ? `/artist/${currentTrack.artistId}`
                    : "#"
                }
                className="text-xs text-neutral-500 truncate hover:text-[#00f0ff] transition-colors"
              >
                {currentTrack.artistName}
              </Link>
            </div>
          </div>

          {/* Center: Controls & Progress */}
          <div className="flex flex-1 items-center justify-center gap-6">
            {/* Playback Controls */}
            <div className="flex items-center gap-4">
              <button
                disabled
                className="text-neutral-600 cursor-not-allowed hover:text-neutral-600"
              >
                <FaStepBackward size={14} />
              </button>

              <button
                onClick={togglePlayPause}
                disabled={isLoading || !videoId}
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

            {/* Time & Progress */}
            <div className="flex items-center gap-3 flex-1 max-w-lg">
              <span className="text-[10px] text-neutral-500 font-mono w-8 text-right">
                {formatTime(currentTime)}
              </span>

              <div
                ref={progressRef}
                className="flex-1 h-1 bg-[#1a1a1f] cursor-pointer group relative rounded-full overflow-visible select-none"
                onClick={handleProgressClick}
                onMouseDown={handleDragStart}
                onMouseMove={handleProgressDrag}
                onMouseUp={handleDragEnd}
                // onMouseLeave handled by global window event now
              >
                {/* Buffered Bar */}
                <div
                  className="absolute top-0 left-0 h-full bg-neutral-600 transition-all duration-300"
                  style={{ width: `${(buffered || 0) * 100}%` }}
                />

                {/* Progress Bar */}
                <div
                  className="absolute top-0 left-0 h-full bg-[#00f0ff] relative"
                  style={{ width: `${progress}%` }}
                >
                  {/* Knob - Always visible now */}
                  <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-md scale-0 group-hover:scale-100 transition-transform duration-100 opacity-100 scale-100" />
                </div>
              </div>

              <span className="text-[10px] text-neutral-500 font-mono w-8">
                {formatTime(duration)}
              </span>
            </div>
          </div>

          {/* Right: Extra Controls */}
          <div className="flex items-center gap-3 min-w-[200px] w-1/4 justify-end">
            {/* Volume Control */}
            <div
              className="relative group flex items-center justify-center"
              onMouseEnter={() => setShowVolumeSlider(true)}
              onMouseLeave={() => setShowVolumeSlider(false)}
            >
              <button
                onClick={toggleMute}
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
                className={`absolute bottom-full left-1/2 -translate-x-1/2 w-10 h-40 bg-[#0a0a0d] border border-[#1a1a1f] shadow-xl flex items-end justify-center pb-4 z-50 transition-all duration-200 ease-out origin-bottom ${showVolumeSlider ? "opacity-100 visible translate-y-0 scale-100" : "opacity-0 invisible translate-y-2 scale-95 pointer-events-none"}`}
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

            <div className="h-4 w-px bg-[#1a1a1f] mx-2" />

            {/* Video Button */}
            <button
              onClick={() => setShowVideo(!showVideo)}
              className={`text-[10px] font-mono px-2 py-1 border transition-colors ${
                showVideo
                  ? "border-[#00f0ff] text-[#00f0ff] bg-[#00f0ff]/10"
                  : "border-[#1a1a1f] text-neutral-600 hover:border-[#00f0ff]/50 hover:text-neutral-400"
              }`}
            >
              {showVideo ? "hide video" : "show video"}
            </button>
            {/* YouTube Link */}
            <a
              href={`https://www.youtube.com/results?search_query=${encodeURIComponent(currentTrack.artistName + " " + currentTrack.title)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-neutral-600 hover:text-neutral-400 transition-colors"
              title="Open in YouTube"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M10 15l5.19-3L10 9v6m11.56-7.83c.13.47.22 1.1.28 1.9.07.8.1 1.49.1 2.09L22 12c0 2.19-.16 3.8-.44 4.83-.25.9-.83 1.48-1.73 1.73-.47.13-1.33.22-2.65.28-1.3.07-2.49.1-3.59.1L12 19c-4.19 0-6.8-.16-7.83-.44-.9-.25-1.48-.83-1.73-1.73-.13-.47-.22-1.1-.28-1.9-.07-.8-.1-1.49-.1-2.09L2 12c0-2.19.16-3.8.44-4.83.25-.9.83-1.48 1.73-1.73.47-.13 1.33-.22 2.65-.28 1.3-.07 2.49-.1 3.59-.1L12 5c4.19 0 6.8.16 7.83.44.9.25 1.48.83 1.73 1.73z" />
              </svg>
            </a>
            {/* Close Button */}
            <button
              onClick={stopPlayback}
              className="text-neutral-500 hover:text-white transition-colors ml-2"
            >
              <FaTimes size={14} />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
