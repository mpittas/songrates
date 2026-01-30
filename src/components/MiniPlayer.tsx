"use client";

import { usePlayer } from "@/context/PlayerContext";
import { FaTimes } from "react-icons/fa";
import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { YouTubeProps } from "react-youtube";

// Components
import TrackInfo from "./player/TrackInfo";
import PlaybackControls from "./player/PlaybackControls";
import ProgressBar from "./player/ProgressBar";
import VolumeControl from "./player/VolumeControl";
import VideoPlayer from "./player/VideoPlayer";

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
  const [showVideo, setShowVideo] = useState(false);

  // Volume State
  const [volume, setVolume] = useState(100);
  const [isMuted, setIsMuted] = useState(false);

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

      // Restore volume and mute state
      if (typeof event.target.setVolume === "function") {
        event.target.setVolume(volume);
        if (isMuted) {
          event.target.mute();
        } else {
          event.target.unMute();
        }
      }

      if (isPlaying) {
        event.target.playVideo();
      } else {
        // Ensure it doesn't autoplay if state says paused
        event.target.pauseVideo();
      }
    },
    [isPlaying, setPlayerRef, volume, isMuted],
  );

  const onStateChange: YouTubeProps["onStateChange"] = useCallback(
    (event: any) => {
      // 0 = ended
      if (event.data === 0) {
        pausePlayback();
      }
    },
    [pausePlayback],
  );

  const handleVolumeChange = useCallback(
    (newVol: number) => {
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

  const toggleMute = useCallback(() => {
    if (!playerRef.current) return;
    if (isMuted) {
      playerRef.current.unMute();
      setIsMuted(false);
    } else {
      playerRef.current.mute();
      setIsMuted(true);
    }
  }, [isMuted]);

  const opts: YouTubeProps["opts"] = useMemo(
    () => ({
      height: "100%",
      width: "100%",
      playerVars: {
        autoplay: isPlaying ? 1 : 0,
        controls: 0,
        origin:
          typeof window !== "undefined" ? window.location.origin : undefined,
      },
    }),
    [isPlaying],
  );

  if (!currentTrack) return null;

  return (
    <>
      <VideoPlayer
        videoId={videoId || ""}
        title={currentTrack.title}
        showVideo={showVideo}
        onClose={() => setShowVideo(false)}
        onReady={onPlayerReady}
        onStateChange={onStateChange}
        opts={opts}
      />

      {/* Bottom Mini Player Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-[#1a1a1f] bg-[#050507]/95 backdrop-blur-sm">
        <div className="flex items-center justify-between gap-6 px-4 py-3 w-full">
          {/* Left: Track Info */}
          <TrackInfo currentTrack={currentTrack} />

          {/* Center: Controls & Progress */}
          <div className="flex flex-1 items-center justify-center gap-6">
            <PlaybackControls
              isPlaying={isPlaying}
              isLoading={isLoading}
              hasVideoId={!!videoId}
              onTogglePlay={togglePlayPause}
            />

            <ProgressBar
              currentTime={currentTime}
              duration={duration}
              buffered={buffered}
              onSeek={seekTo}
            />
          </div>

          {/* Right: Extra Controls */}
          <div className="flex items-center gap-3 min-w-[200px] w-1/4 justify-end">
            <VolumeControl
              volume={volume}
              isMuted={isMuted}
              onVolumeChange={handleVolumeChange}
              onToggleMute={toggleMute}
            />

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
              href={`https://www.youtube.com/results?search_query=${encodeURIComponent(
                currentTrack.artistName + " " + currentTrack.title,
              )}`}
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
