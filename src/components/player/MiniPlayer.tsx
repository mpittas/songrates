"use client";

import { usePlayer } from "@/context/PlayerContext";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { YouTubeEvent, YouTubeProps } from "react-youtube";
import { LuList, LuTv, LuX, LuYoutube } from "react-icons/lu";

import { useRatingsContext as useRatings } from "@/context/RatingsContext";
import TrackRating from "@/components/rating/TrackRating";
import { AlbumContext } from "@/types/music";
import { YouTubePlayer } from "@/types/player";
import { cn } from "@/lib/utils";

import TrackInfo from "./TrackInfo";
import PlaybackControls from "./PlaybackControls";
import ProgressBar from "./ProgressBar";
import VolumeControl from "./VolumeControl";
import VideoPlayer from "./VideoPlayer";
import AlbumTracklistPopover from "./AlbumTracklistPopover";

function IconButton({
  label,
  active,
  onClick,
  href,
  children,
}: {
  label: string;
  active?: boolean;
  onClick?: () => void;
  href?: string;
  children: React.ReactNode;
}) {
  const className = cn(
    "flex size-8 items-center justify-center rounded-full transition-colors duration-150",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40",
    active ? "text-white" : "text-white/40 hover:text-white",
  );

  if (href) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={label}
        title={label}
        onClick={onClick}
        className={className}
      >
        {children}
      </a>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className={className}
    >
      {children}
    </button>
  );
}

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
    nextTrack,
    prevTrack,
    hasNext,
    hasPrev,
    isRepeating,
    toggleRepeat,
    isShuffling,
    toggleShuffle,
  } = usePlayer();

  const { ratings } = useRatings();
  const playerRef = useRef<YouTubePlayer | null>(null);
  const tracklistButtonRef = useRef<HTMLButtonElement>(null);
  const [showVideo, setShowVideo] = useState(false);
  const [showTracklist, setShowTracklist] = useState(false);

  const rating = currentTrack ? ratings[currentTrack.id] || 0 : 0;
  const albumContext: AlbumContext | undefined =
    currentTrack?.albumId && currentTrack.albumTitle
      ? {
          albumId: currentTrack.albumId,
          title: currentTrack.albumTitle,
          artistName: currentTrack.artistName || "Unknown Artist",
          releaseDate: currentTrack.releaseDate,
          totalTracks: currentTrack.totalTracks,
          artworkUrl: currentTrack.albumImageUrl,
        }
      : undefined;

  const [volume, setVolume] = useState(100);
  const [isMuted, setIsMuted] = useState(false);

  useEffect(() => {
    if (!currentTrack) setShowTracklist(false);
  }, [currentTrack]);

  useEffect(() => {
    if (!videoId || !isPlaying) return;

    const interval = setInterval(() => {
      if (
        playerRef.current &&
        typeof playerRef.current.getCurrentTime === "function"
      ) {
        const time = playerRef.current.getCurrentTime();
        const duration = playerRef.current.getDuration();
        const loaded = playerRef.current.getVideoLoadedFraction();
        updateProgress(time, duration, loaded);
      }
    }, 100);

    return () => clearInterval(interval);
  }, [videoId, isPlaying, updateProgress]);

  useEffect(() => {
    if (!videoId) {
      playerRef.current = null;
      setPlayerRef(null);
    }
  }, [videoId, setPlayerRef]);

  useEffect(() => {
    const handleFocus = () => {
      if (
        playerRef.current &&
        typeof playerRef.current.getPlayerState === "function"
      ) {
        const state = playerRef.current.getPlayerState();
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
        event.target.pauseVideo();
      }
    },
    [isPlaying, setPlayerRef, volume, isMuted],
  );

  const onStateChange: YouTubeProps["onStateChange"] = useCallback(
    (event: YouTubeEvent) => {
      if (event.data === 1) {
        if (!isPlaying) setIsPlaying(true);
      }
      if (event.data === 2) {
        if (isPlaying) setIsPlaying(false);
      }
      if (event.data === 0) {
        if (isRepeating && playerRef.current) {
          playerRef.current.seekTo(0, true);
          playerRef.current.playVideo();
          return;
        }
        if (hasNext) {
          nextTrack();
        } else {
          setIsPlaying(false);
        }
      }
    },
    [isPlaying, setIsPlaying, isRepeating, hasNext, nextTrack],
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
      host: "https://www.youtube-nocookie.com",
      playerVars: {
        autoplay: 1,
        controls: 0,
        rel: 0,
        iv_load_policy: 3,
        modestbranding: 1,
        enablejsapi: 1,
        origin:
          typeof window !== "undefined" ? window.location.origin : undefined,
      },
    }),
    [],
  );

  const youtubeHref = currentTrack
    ? `https://www.youtube.com/results?search_query=${encodeURIComponent(
        `${currentTrack.artistName} ${currentTrack.title}`,
      )}`
    : undefined;

  return (
    <>
      {videoId && (
        <VideoPlayer
          videoId={videoId}
          title={currentTrack?.title || "No track selected"}
          showVideo={showVideo && !!currentTrack}
          onClose={() => setShowVideo(false)}
          onReady={onPlayerReady}
          onStateChange={onStateChange}
          opts={opts}
        />
      )}

      <div
        className={cn(
          "fixed right-0 bottom-0 left-0 z-[60] safe-area-bottom",
          "bg-[#0a0a0a] text-white",
          "transition-transform duration-400 ease-[cubic-bezier(0.22,1,0.36,1)]",
          currentTrack ? "translate-y-0" : "translate-y-full",
        )}
      >
        <div className="md:hidden">
          <ProgressBar
            compact
            currentTime={currentTime}
            duration={duration}
            buffered={buffered}
            onSeek={seekTo}
          />
        </div>

        <div className="flex items-center gap-2 px-3 py-2.5 md:grid md:grid-cols-[minmax(0,1fr)_minmax(280px,1.4fr)_minmax(0,1fr)] md:gap-6 md:px-4 md:py-3">
          <div className="flex min-w-0 flex-1 items-center gap-3 md:flex-none">
            {currentTrack && <TrackInfo currentTrack={currentTrack} />}
            <div className="hidden shrink-0 md:block">
              <TrackRating
                trackId={currentTrack?.id}
                albumContext={albumContext}
                displayRating={rating}
                showPublicRating={false}
              />
            </div>
          </div>

          <div className="flex shrink-0 flex-col items-center justify-center gap-1.5">
            <PlaybackControls
              isPlaying={isPlaying}
              isLoading={isLoading}
              hasVideoId={!!videoId}
              onTogglePlay={togglePlayPause}
              onNext={nextTrack}
              onPrev={prevTrack}
              hasNext={hasNext}
              hasPrev={hasPrev}
              isRepeating={isRepeating}
              onToggleRepeat={toggleRepeat}
              isShuffling={isShuffling}
              onToggleShuffle={toggleShuffle}
            />
            <div className="hidden w-full max-w-[520px] md:block">
              <ProgressBar
                currentTime={currentTime}
                duration={duration}
                buffered={buffered}
                onSeek={seekTo}
              />
            </div>
          </div>

          <div className="hidden items-center justify-end gap-0.5 md:flex">
            <button
              ref={tracklistButtonRef}
              type="button"
              aria-label="Album tracks"
              title="Album tracks"
              aria-expanded={showTracklist}
              onClick={() => setShowTracklist((open) => !open)}
              className={cn(
                "flex size-8 items-center justify-center rounded-full transition-colors duration-150",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40",
                showTracklist ? "text-white" : "text-white/40 hover:text-white",
              )}
            >
              <LuList size={16} strokeWidth={2} />
            </button>
            <AlbumTracklistPopover
              albumId={currentTrack?.albumId || ""}
              currentTrackId={currentTrack?.id || ""}
              isVisible={showTracklist}
              anchorRef={tracklistButtonRef}
              onClose={() => setShowTracklist(false)}
            />

            <VolumeControl
              volume={volume}
              isMuted={isMuted}
              onVolumeChange={handleVolumeChange}
              onToggleMute={toggleMute}
            />

            <IconButton
              label={showVideo ? "Hide video" : "Show video"}
              active={showVideo}
              onClick={() => setShowVideo((open) => !open)}
            >
              <LuTv size={16} strokeWidth={2} />
            </IconButton>

            {youtubeHref ? (
              <IconButton
                label="Open in YouTube"
                href={youtubeHref}
                onClick={pausePlayback}
              >
                <LuYoutube size={16} strokeWidth={2} />
              </IconButton>
            ) : null}

            <IconButton label="Close player" onClick={stopPlayback}>
              <LuX size={16} strokeWidth={2} />
            </IconButton>
          </div>

          <button
            type="button"
            onClick={stopPlayback}
            className="flex size-8 shrink-0 items-center justify-center rounded-full text-white/40 transition-colors hover:text-white md:hidden"
            aria-label="Close player"
          >
            <LuX size={16} strokeWidth={2} />
          </button>
        </div>
      </div>
    </>
  );
}
