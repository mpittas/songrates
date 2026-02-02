"use client";

import { usePlayer } from "@/context/PlayerContext";
import { FaTimes, FaYoutube } from "react-icons/fa";
import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { YouTubeProps, YouTubeEvent } from "react-youtube";
import { YouTubePlayer } from "@/types/player";

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
    setIsPlaying,
  } = usePlayer();
  const playerRef = useRef<YouTubePlayer | null>(null);
  const [showVideo, setShowVideo] = useState(false);

  const [volume, setVolume] = useState(100);
  const [isMuted, setIsMuted] = useState(false);

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

  useEffect(() => {
    const handleFocus = () => {
      if (
        playerRef.current &&
        typeof playerRef.current.getPlayerState === "function"
      ) {
        const state = playerRef.current.getPlayerState();
        // 1 = playing, 2 = paused
        if (state === 1 && !isPlaying) {
          setIsPlaying(true);
        } else if (state === 2 && isPlaying) {
          setIsPlaying(false);
        }
      }
    };

    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, [isPlaying, setIsPlaying]);

  const onPlayerReady: YouTubeProps["onReady"] = useCallback(
    (event: YouTubeEvent) => {
      playerRef.current = event.target;
      setPlayerRef(event.target);

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
    (event: YouTubeEvent) => {
      // 1 = playing
      if (event.data === 1) {
        if (!isPlaying) setIsPlaying(true);
      }
      // 2 = paused
      if (event.data === 2) {
        if (isPlaying) setIsPlaying(false);
      }
      // 0 = ended
      if (event.data === 0) {
        setIsPlaying(false);
      }
    },
    [isPlaying, setIsPlaying],
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

      <div className="fixed bottom-0 left-0 right-0 z-[60] border-t border-[#1a1a1f] bg-[#050507]/95 backdrop-blur-sm">
        <div className="flex items-center justify-between gap-6 px-4 py-3 w-full">
          <TrackInfo currentTrack={currentTrack} />

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

          <div className="flex items-center gap-3 min-w-[200px] w-1/4 justify-end">
            <VolumeControl
              volume={volume}
              isMuted={isMuted}
              onVolumeChange={handleVolumeChange}
              onToggleMute={toggleMute}
            />

            <div className="h-4 w-px bg-[#1a1a1f] mx-2" />

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
            <a
              href={`https://www.youtube.com/results?search_query=${encodeURIComponent(
                currentTrack.artistName + " " + currentTrack.title,
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => pausePlayback()}
              className="text-neutral-600 hover:text-neutral-400 transition-colors"
              title="Open in YouTube"
            >
              <FaYoutube size={16} />
            </a>
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
