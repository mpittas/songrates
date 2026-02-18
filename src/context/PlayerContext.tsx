"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useRef,
  useCallback,
} from "react";

import { Track } from "@/types/music";
import { PlayerContextType, YouTubePlayer } from "@/types/player";

const PlayerContext = createContext<PlayerContextType | null>(null);

export function PlayerProvider({ children }: { children: ReactNode }) {
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [videoId, setVideoId] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [buffered, setBuffered] = useState(0);
  const [isRepeating, setIsRepeating] = useState(false);

  const [queue, setQueue] = useState<Track[]>([]);

  const playerRef = useRef<YouTubePlayer | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const currentIndex = queue.findIndex((t) => t.id === currentTrack?.id);
  const hasNext =
    queue.length > 0 && currentIndex !== -1 && currentIndex < queue.length - 1;
  const hasPrev = queue.length > 0 && currentIndex !== -1 && currentIndex > 0;

  const setPlayerRef = useCallback((player: YouTubePlayer | null) => {
    playerRef.current = player;
  }, []);

  const updateProgress = useCallback(
    (current: number, total: number, bufferedData?: number) => {
      setCurrentTime(current);
      setDuration(total);
      if (bufferedData !== undefined) {
        setBuffered(bufferedData);
      }
    },
    [],
  );

  const seekTo = useCallback((seconds: number) => {
    if (playerRef.current && typeof playerRef.current.seekTo === "function") {
      playerRef.current.seekTo(seconds, true);
    }
  }, []);

  const playTrack = useCallback(
    async (track: Track, newQueue?: Track[]) => {
      // If same track, just toggle play (ignore queue update in this case usually)
      if (currentTrack?.id === track.id && videoId) {
        if (playerRef.current) {
          if (isPlaying) {
            playerRef.current.pauseVideo?.();
            setIsPlaying(false);
          } else {
            playerRef.current.playVideo?.();
            setIsPlaying(true);
          }
        } else {
          setIsPlaying(!isPlaying);
        }
        return;
      }

      // Update queue if provided, or default to single track if not (and different track)
      if (newQueue) {
        setQueue(newQueue);
      } else if (!queue.find((t) => t.id === track.id)) {
        // If playing a track not in current queue, replace queue
        setQueue([track]);
      }

      // Cancel any pending search
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      abortControllerRef.current = new AbortController();

      // Immediately update UI with new track info (optimistic update)
      setCurrentTrack(track);
      setIsLoading(true);
      setCurrentTime(0);
      setDuration(0);
      setBuffered(0);

      try {
        let searchQuery = `${track.artistName} ${track.title} audio`;
        if (track.artists && track.artists.length > 0) {
          const artistNames = track.artists.map((a) => a.name).join(" ");
          searchQuery = `${artistNames} ${track.title} audio`;
        }
        const res = await fetch(
          `/api/youtube-search?q=${encodeURIComponent(searchQuery)}`,
          { signal: abortControllerRef.current.signal },
        );
        const data = await res.json();

        if (data.videoId) {
          // Capture ref locally to avoid race condition
          const player = playerRef.current;
          // Use loadVideoById for faster switching if player exists
          if (
            player &&
            typeof player.loadVideoById === "function" &&
            videoId // Only use loadVideoById if we already have a video loaded
          ) {
            player.loadVideoById(data.videoId);
            setVideoId(data.videoId);
            setIsPlaying(true);
          } else {
            // First time or player not ready - set videoId to trigger player mount
            setVideoId(data.videoId);
            setIsPlaying(true);
          }
        }
      } catch (e: unknown) {
        // Ignore abort errors
        if (e instanceof Error && e.name !== "AbortError") {
          console.error("Failed to search YouTube:", e);
        }
      }

      setIsLoading(false);
    },
    [currentTrack?.id, videoId, isPlaying, queue],
  );

  const nextTrack = useCallback(() => {
    if (hasNext) {
      // Pass current queue to preserve it
      playTrack(queue[currentIndex + 1], queue);
    }
  }, [hasNext, queue, currentIndex, playTrack]);

  const prevTrack = useCallback(() => {
    if (hasPrev) {
      playTrack(queue[currentIndex - 1], queue);
    }
  }, [hasPrev, queue, currentIndex, playTrack]);

  const stopPlayback = () => {
    setCurrentTrack(null);
    // Keep videoId to avoid unmounting the player instance
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
  };

  const pausePlayback = () => {
    setIsPlaying(false);
    if (
      playerRef.current &&
      typeof playerRef.current.pauseVideo === "function"
    ) {
      playerRef.current.pauseVideo();
    }
  };

  const togglePlayPause = () => {
    if (
      playerRef.current &&
      typeof playerRef.current.getPlayerState === "function"
    ) {
      const state = playerRef.current.getPlayerState();
      // 1 = playing, 2 = paused
      if (state === 1) {
        playerRef.current.pauseVideo();
        setIsPlaying(false);
      } else {
        playerRef.current.playVideo();
        setIsPlaying(true);
      }
    } else {
      // Fallback state toggle
      setIsPlaying(!isPlaying);
    }
  };

  const toggleRepeat = useCallback(() => {
    setIsRepeating((prev) => !prev);
  }, []);

  return (
    <PlayerContext.Provider
      value={{
        currentTrack,
        videoId,
        isPlaying,
        isLoading,
        currentTime,
        duration,
        buffered,
        queue,
        setIsPlaying,
        playTrack,
        stopPlayback,
        pausePlayback,
        togglePlayPause,
        seekTo,
        nextTrack,
        prevTrack,
        hasNext,
        hasPrev,
        setPlayerRef,
        updateProgress,
        isRepeating,
        toggleRepeat,
      }}
    >
      {children}
    </PlayerContext.Provider>
  );
}

export function usePlayer() {
  const context = useContext(PlayerContext);
  if (!context) {
    throw new Error("usePlayer must be used within a PlayerProvider");
  }
  return context;
}
