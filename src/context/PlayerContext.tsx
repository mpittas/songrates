"use client";

import {
  createContext,
  useContext,
  useState,
  ReactNode,
  useRef,
  useCallback,
} from "react";

import { Track } from "@/types/music";

interface PlayerContextType {
  currentTrack: Track | null;
  videoId: string | null;
  isPlaying: boolean;
  isLoading: boolean;
  currentTime: number;
  duration: number;
  buffered: number;
  playTrack: (track: Track) => Promise<void>;
  stopPlayback: () => void;
  pausePlayback: () => void;
  togglePlayPause: () => void;
  seekTo: (seconds: number) => void;
  setPlayerRef: (player: any) => void;
  updateProgress: (current: number, total: number, buffered?: number) => void;
}

const PlayerContext = createContext<PlayerContextType | null>(null);

export function PlayerProvider({ children }: { children: ReactNode }) {
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [videoId, setVideoId] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [buffered, setBuffered] = useState(0);
  const playerRef = useRef<any>(null);

  const setPlayerRef = useCallback((player: any) => {
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

  const playTrack = async (track: Track) => {
    // If same track, just toggle play
    if (currentTrack?.id === track.id && videoId) {
      setIsPlaying(!isPlaying);
      return;
    }

    setIsLoading(true);
    setCurrentTrack(track);
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);

    try {
      const searchQuery = `${track.artistName} ${track.title} audio`;
      const res = await fetch(
        `/api/youtube-search?q=${encodeURIComponent(searchQuery)}`,
      );
      const data = await res.json();

      if (data.videoId) {
        setVideoId(data.videoId);
        setIsPlaying(true);
      }
    } catch (e) {
      console.error("Failed to search YouTube:", e);
    }

    setIsLoading(false);
  };

  const stopPlayback = () => {
    setCurrentTrack(null);
    setVideoId(null);
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
        playTrack,
        stopPlayback,
        pausePlayback,
        togglePlayPause,
        seekTo,
        setPlayerRef,
        updateProgress,
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
