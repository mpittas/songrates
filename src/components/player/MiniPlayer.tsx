"use client";

import { usePlayer } from "@/context/PlayerContext";
import { FaTimes, FaYoutube, FaList } from "react-icons/fa";
import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { YouTubeProps, YouTubeEvent } from "react-youtube";
import { YouTubePlayer } from "@/types/player";

import { useRatingsContext as useRatings } from "@/context/RatingsContext";
import ColorRating from "@/components/rating/ColorRating";
import { AlbumContext } from "@/types/music";

import TrackInfo from "./TrackInfo";
import PlaybackControls from "./PlaybackControls";
import ProgressBar from "./ProgressBar";
import VolumeControl from "./VolumeControl";
import VideoPlayer from "./VideoPlayer";
import AlbumTracklistPopover from "./AlbumTracklistPopover";

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

  const { ratings, setRating } = useRatings();
  const playerRef = useRef<YouTubePlayer | null>(null);
  const showTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [showVideo, setShowVideo] = useState(false);
  const [showTracklist, setShowTracklist] = useState(false);

  const rating = currentTrack ? ratings[currentTrack.id] || 0 : 0;

  const handleRate = useCallback(
    (val: number) => {
      if (!currentTrack) return;

      if (
        currentTrack.albumId &&
        currentTrack.albumTitle &&
        currentTrack.totalTracks !== undefined
      ) {
        const albumContext: AlbumContext = {
          albumId: currentTrack.albumId,
          title: currentTrack.albumTitle,
          artistName: currentTrack.artistName || "Unknown Artist",
          releaseDate: currentTrack.releaseDate,
          totalTracks: currentTrack.totalTracks,
          artworkUrl: currentTrack.albumImageUrl,
        };
        setRating(currentTrack.id, val, albumContext);
      } else {
        setRating(currentTrack.id, val);
      }
    },
    [currentTrack, setRating],
  );

  const handleMouseEnterTracklist = () => {
    if (showTimeoutRef.current) clearTimeout(showTimeoutRef.current);
    setShowTracklist(true);
  };

  const handleMouseLeaveTracklist = () => {
    showTimeoutRef.current = setTimeout(() => {
      setShowTracklist(false);
    }, 100);
  };

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
    // Reset player ref when videoId becomes null (player unmounts)
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

  // No early return here to keep the YouTube instance mounted in VideoPlayer

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
        className={`fixed bottom-0 left-0 right-0 z-[60] border-t border-[#dcdcdc] bg-[#ebe8e5]/95 backdrop-blur-sm safe-area-bottom transition-transform duration-500 ease-in-out ${
          currentTrack ? "translate-y-0" : "translate-y-full"
        }`}
      >
        <div className="flex items-center justify-between gap-2 md:gap-6 px-4 py-3 w-full">
          {/* Track Info - Left */}
          <div className="flex-1 basis-0 min-w-0">
            {currentTrack && <TrackInfo currentTrack={currentTrack} />}
          </div>

          {/* Controls - Center */}
          <div className="flex-[3] flex items-center justify-center gap-2 md:gap-6">
            <div className="md:hidden">
              {/* Mobile only simplified controls if needed, but PlaybackControls handles responsive inside? 
                   Let's keep it simple: Show controls, but hide bar on very narrow screens if needed, 
                   or actually, let's keep the bar but make it flexible.
               */}
            </div>

            {/* Rating Component - Desktop */}
            <div className="hidden md:block">
              <ColorRating rating={rating} onRate={handleRate} />
            </div>

            {/* Tracklist Popover Trigger - Desktop Left of Controls */}
            <div
              className="hidden md:block relative"
              onMouseEnter={handleMouseEnterTracklist}
              onMouseLeave={handleMouseLeaveTracklist}
            >
              <button
                className={`p-2 text-neutral-500 hover:text-neutral-900 transition-colors ${
                  showTracklist ? "text-neutral-900" : ""
                }`}
              >
                <FaList size={14} />
              </button>

              <AlbumTracklistPopover
                albumId={currentTrack?.albumId || ""}
                currentTrackId={currentTrack?.id || ""}
                isVisible={showTracklist && !!currentTrack?.albumId}
              />
            </div>

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

            <div className="hidden md:flex items-center gap-4 w-[500px]">
              <ProgressBar
                currentTime={currentTime}
                duration={duration}
                buffered={buffered}
                onSeek={seekTo}
              />
            </div>
            <VolumeControl
              volume={volume}
              isMuted={isMuted}
              onVolumeChange={handleVolumeChange}
              onToggleMute={toggleMute}
            />
          </div>

          {/* Right Side - Extras (Hidden on Mobile) */}
          <div className="hidden md:flex flex-1 basis-0 items-center gap-3 justify-end">
            <div className="h-4 w-px bg-[#d2d2d2] mx-2" />

            <button
              onClick={() => setShowVideo(!showVideo)}
              className={`text-[10px] font-mono px-2 py-1 border transition-colors ${
                showVideo
                  ? "border-[#1f1f1f] text-neutral-900 bg-[#eaeaea]"
                  : "border-[#d2d2d2] text-neutral-600 hover:border-[#bdbdbd] hover:text-neutral-900"
              }`}
              aria-label={showVideo ? "Hide video" : "Show video"}
            >
              {showVideo ? "hide video" : "show video"}
            </button>

            {/* Tracklist Popover Trigger */}

            <a
              href={
                currentTrack
                  ? `https://www.youtube.com/results?search_query=${encodeURIComponent(
                      currentTrack.artistName + " " + currentTrack.title,
                    )}`
                  : "#"
              }
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => pausePlayback()}
              className="text-neutral-600 hover:text-neutral-900 transition-colors"
              title="Open in YouTube"
              aria-label="Open in YouTube"
            >
              <FaYoutube size={16} />
            </a>
            <button
              onClick={stopPlayback}
              className="text-neutral-500 hover:text-neutral-900 transition-colors ml-2"
              aria-label="Close player"
            >
              <FaTimes size={14} />
            </button>
          </div>

          {/* Mobile Close Button (visible only on mobile) */}
          <button
            onClick={stopPlayback}
            className="md:hidden text-neutral-500 hover:text-neutral-900 transition-colors ml-2 p-2"
            aria-label="Close player"
          >
            <FaTimes size={16} />
          </button>
        </div>

        {/* Mobile Progress Bar absolute at top */}
        <div className="md:hidden absolute top-0 left-0 right-0 h-[2px] w-full bg-[#d4d4d4]">
          <div
            className="h-full bg-[#1f1f1f] transition-all duration-100 ease-linear"
            style={{
              width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%`,
            }}
          />
        </div>
      </div>
    </>
  );
}
