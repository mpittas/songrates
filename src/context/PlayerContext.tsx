"use client";

import {
  createContext,
  useContext,
  useState,
  ReactNode,
  useRef,
  useCallback,
} from "react";

interface Track {
  id: string;
  title: string;
  artistName: string;
}

interface PlayerContextType {
  currentTrack: Track | null;
  videoId: string | null;
  isPlaying: boolean;
  isLoading: boolean;
  currentTime: number;
  duration: number;
  playTrack: (track: Track) => Promise<void>;
  stopPlayback: () => void;
  togglePlayPause: () => void;
  seekTo: (seconds: number) => void;
  setPlayerRef: (iframe: HTMLIFrameElement | null) => void;
  updateProgress: (current: number, total: number) => void;
}

const PlayerContext = createContext<PlayerContextType | null>(null);

export function PlayerProvider({ children }: { children: ReactNode }) {
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [videoId, setVideoId] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const playerRef = useRef<HTMLIFrameElement | null>(null);

  const setPlayerRef = useCallback((iframe: HTMLIFrameElement | null) => {
    playerRef.current = iframe;
  }, []);

  const updateProgress = useCallback((current: number, total: number) => {
    setCurrentTime(current);
    setDuration(total);
  }, []);

  const seekTo = useCallback((seconds: number) => {
    if (playerRef.current) {
      playerRef.current.contentWindow?.postMessage(
        JSON.stringify({
          event: "command",
          func: "seekTo",
          args: [seconds, true],
        }),
        "*",
      );
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

  const togglePlayPause = () => {
    setIsPlaying(!isPlaying);
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
        playTrack,
        stopPlayback,
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
