"use client";

import {
  createContext,
  useContext,
  useState,
  ReactNode,
  useRef,
  useCallback,
  useMemo,
} from "react";

import { Track } from "@/types/music";
import {
  PlayerContextType,
  PlayerCoreContextType,
  PlayerProgressContextType,
  YouTubePlayer,
} from "@/types/player";

const shuffleArray = (array: Track[], startTrackId?: string) => {
  const remainingTracks = array.filter((t) => t.id !== startTrackId);
  const shuffled = remainingTracks.slice();
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return startTrackId
    ? [array.find((t) => t.id === startTrackId)!, ...shuffled]
    : shuffled;
};

const PlayerCoreContext = createContext<PlayerCoreContextType | null>(null);
const PlayerProgressContext = createContext<PlayerProgressContextType | null>(
  null,
);

const YOUTUBE_CACHE_KEY = "songrates:youtube-search-cache:v1";
const YOUTUBE_CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

type StoredYoutubeCache = Record<
  string,
  {
    videoId: string | null;
    cachedAt: number;
  }
>;

function readStoredYoutubeVideoId(query: string): string | null | undefined {
  if (typeof window === "undefined") return undefined;

  try {
    const raw = window.localStorage.getItem(YOUTUBE_CACHE_KEY);
    if (!raw) return undefined;

    const cache = JSON.parse(raw) as StoredYoutubeCache;
    const entry = cache[query];
    if (!entry) return undefined;

    if (Date.now() - entry.cachedAt > YOUTUBE_CACHE_TTL_MS) {
      delete cache[query];
      window.localStorage.setItem(YOUTUBE_CACHE_KEY, JSON.stringify(cache));
      return undefined;
    }

    return entry.videoId;
  } catch {
    return undefined;
  }
}

function writeStoredYoutubeVideoId(query: string, videoId: string | null) {
  if (typeof window === "undefined") return;

  try {
    const raw = window.localStorage.getItem(YOUTUBE_CACHE_KEY);
    const cache = raw ? (JSON.parse(raw) as StoredYoutubeCache) : {};
    cache[query] = { videoId, cachedAt: Date.now() };

    const entries = Object.entries(cache)
      .sort(([, a], [, b]) => b.cachedAt - a.cachedAt)
      .slice(0, 300);
    window.localStorage.setItem(
      YOUTUBE_CACHE_KEY,
      JSON.stringify(Object.fromEntries(entries)),
    );
  } catch {
    // Local storage is an opportunistic cost cache; ignore quota/privacy errors.
  }
}

export function PlayerProvider({ children }: { children: ReactNode }) {
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [videoId, setVideoId] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [buffered, setBuffered] = useState(0);
  const [isRepeating, setIsRepeating] = useState(false);
  const [isShuffling, setIsShuffling] = useState(false);
  const [currentLyricsTrackId, setCurrentLyricsTrackId] = useState<
    string | null
  >(null);

  const [queue, setQueue] = useState<Track[]>([]);
  const [originalQueue, setOriginalQueue] = useState<Track[]>([]);

  const playerRef = useRef<YouTubePlayer | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const youtubeSearchCacheRef = useRef<Map<string, string | null>>(new Map());

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

      if (newQueue) {
        if (isShuffling) {
          setOriginalQueue(newQueue);
          setQueue(shuffleArray(newQueue, track.id));
        } else {
          setQueue(newQueue);
        }
      } else if (!queue.find((t) => t.id === track.id)) {
        const newQ = [track];
        setQueue(newQ);
        if (isShuffling) {
          setOriginalQueue(newQ);
        }
      }

      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      abortControllerRef.current = new AbortController();

      if (currentTrack?.id !== track.id && currentLyricsTrackId !== track.id) {
        setCurrentLyricsTrackId(null);
      }

      setCurrentTrack(track);
      setIsLoading(true);
      setCurrentTime(0);
      setDuration(0);
      setBuffered(0);

      if (
        playerRef.current &&
        typeof playerRef.current.pauseVideo === "function"
      ) {
        playerRef.current.pauseVideo();
      }

      try {
        let searchQuery = `${track.artistName} ${track.title} audio`;
        if (track.artists && track.artists.length > 0) {
          const artistNames = track.artists.map((a) => a.name).join(" ");
          searchQuery = `${artistNames} ${track.title} audio`;
        }

        const cachedVideoId = youtubeSearchCacheRef.current.get(searchQuery);
        if (cachedVideoId !== undefined) {
          setVideoId(cachedVideoId);
          setIsPlaying(Boolean(cachedVideoId));
          setIsLoading(false);
          return;
        }

        const storedVideoId = readStoredYoutubeVideoId(searchQuery);
        if (storedVideoId !== undefined) {
          youtubeSearchCacheRef.current.set(searchQuery, storedVideoId);
          setVideoId(storedVideoId);
          setIsPlaying(Boolean(storedVideoId));
          setIsLoading(false);
          return;
        }

        const res = await fetch(
          `/api/youtube-search?q=${encodeURIComponent(searchQuery)}`,
          { signal: abortControllerRef.current.signal },
        );
        const data = await res.json();
        const nextVideoId = data.videoId || null;
        youtubeSearchCacheRef.current.set(searchQuery, nextVideoId);
        writeStoredYoutubeVideoId(searchQuery, nextVideoId);

        if (nextVideoId) {
          setVideoId(nextVideoId);
          setIsPlaying(true);
        }
      } catch (e: unknown) {
        if (e instanceof Error && e.name !== "AbortError") {
          console.error("Failed to search YouTube:", e);
        }
      }

      setIsLoading(false);
    },
    [
      currentTrack?.id,
      currentLyricsTrackId,
      videoId,
      isPlaying,
      queue,
      isShuffling,
    ],
  );

  const nextTrack = useCallback(() => {
    if (hasNext) {
      playTrack(queue[currentIndex + 1]);
    }
  }, [hasNext, queue, currentIndex, playTrack]);

  const prevTrack = useCallback(() => {
    if (hasPrev) {
      playTrack(queue[currentIndex - 1]);
    }
  }, [hasPrev, queue, currentIndex, playTrack]);

  const stopPlayback = useCallback(() => {
    setCurrentTrack(null);
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
  }, []);

  const pausePlayback = useCallback(() => {
    setIsPlaying(false);
    if (
      playerRef.current &&
      typeof playerRef.current.pauseVideo === "function"
    ) {
      playerRef.current.pauseVideo();
    }
  }, []);

  const togglePlayPause = useCallback(() => {
    if (
      playerRef.current &&
      typeof playerRef.current.getPlayerState === "function"
    ) {
      const state = playerRef.current.getPlayerState();
      if (state === 1) {
        playerRef.current.pauseVideo();
        setIsPlaying(false);
      } else {
        playerRef.current.playVideo();
        setIsPlaying(true);
      }
    } else {
      setIsPlaying((p) => !p);
    }
  }, []);

  const toggleRepeat = useCallback(() => {
    setIsRepeating((prev) => {
      const next = !prev;
      if (next && isShuffling) {
        if (originalQueue.length > 0) {
          setQueue(originalQueue);
        }
        setIsShuffling(false);
      }
      return next;
    });
  }, [isShuffling, originalQueue]);

  const toggleShuffle = useCallback(() => {
    setIsShuffling((prev) => {
      const nextShuffle = !prev;
      if (nextShuffle) {
        setIsRepeating(false);
        setOriginalQueue(queue);
        if (currentTrack) {
          setQueue(shuffleArray(queue, currentTrack.id));
        } else {
          setQueue(shuffleArray(queue));
        }
      } else {
        if (originalQueue.length > 0) {
          setQueue(originalQueue);
        }
      }
      return nextShuffle;
    });
  }, [queue, currentTrack, originalQueue]);

  const coreValue = useMemo<PlayerCoreContextType>(
    () => ({
      currentTrack,
      videoId,
      isPlaying,
      isLoading,
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
      isRepeating,
      toggleRepeat,
      isShuffling,
      toggleShuffle,
      currentLyricsTrackId,
      setCurrentLyricsTrackId,
    }),
    [
      currentTrack,
      videoId,
      isPlaying,
      isLoading,
      queue,
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
      isRepeating,
      toggleRepeat,
      isShuffling,
      toggleShuffle,
      currentLyricsTrackId,
    ],
  );

  const progressValue = useMemo<PlayerProgressContextType>(
    () => ({
      currentTime,
      duration,
      buffered,
      updateProgress,
    }),
    [currentTime, duration, buffered, updateProgress],
  );

  return (
    <PlayerCoreContext.Provider value={coreValue}>
      <PlayerProgressContext.Provider value={progressValue}>
        {children}
      </PlayerProgressContext.Provider>
    </PlayerCoreContext.Provider>
  );
}

/** Full player API — re-renders on progress ticks (use in MiniPlayer only). */
export function usePlayer(): PlayerContextType {
  const core = useContext(PlayerCoreContext);
  const progress = useContext(PlayerProgressContext);
  if (!core || !progress) {
    throw new Error("usePlayer must be used within a PlayerProvider");
  }
  return useMemo(
    () => ({ ...core, ...progress }),
    [core, progress],
  ) as PlayerContextType;
}

/** Core playback + queue — stable while audio position updates (SongRow, track lists). */
export function usePlayerCore(): PlayerCoreContextType {
  const core = useContext(PlayerCoreContext);
  if (!core) {
    throw new Error("usePlayerCore must be used within a PlayerProvider");
  }
  return core;
}
