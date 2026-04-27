import { YouTubeProps, YouTubeEvent } from "react-youtube";
import { Track } from "./music";

// YouTube Player instance type
export interface YouTubePlayer {
  playVideo: () => void;
  pauseVideo: () => void;
  seekTo: (seconds: number, allowSeekAhead: boolean) => void;
  loadVideoById: (videoId: string) => void;
  getCurrentTime: () => number;
  getDuration: () => number;
  getVideoLoadedFraction: () => number;
  getPlayerState: () => number;
  setVolume: (volume: number) => void;
  mute: () => void;
  unMute: () => void;
}

export interface PlayerContextType {
  currentTrack: Track | null;
  videoId: string | null;
  queue: Track[];
  isPlaying: boolean;
  isLoading: boolean;
  currentTime: number;
  duration: number;
  buffered: number;
  setIsPlaying: (playing: boolean) => void;
  playTrack: (track: Track, queue?: Track[]) => Promise<void>;
  stopPlayback: () => void;
  pausePlayback: () => void;
  togglePlayPause: () => void;
  seekTo: (seconds: number) => void;
  nextTrack: () => void;
  prevTrack: () => void;
  hasNext: boolean;
  hasPrev: boolean;
  setPlayerRef: (player: YouTubePlayer | null) => void;
  updateProgress: (current: number, total: number, buffered?: number) => void;
  isRepeating: boolean;
  toggleRepeat: () => void;
  isShuffling: boolean;
  toggleShuffle: () => void;
  currentLyricsTrackId: string | null;
  setCurrentLyricsTrackId: (id: string | null) => void;
}

export interface PlaybackControlsProps {
  isPlaying: boolean;
  isLoading: boolean;
  hasVideoId: boolean;
  onTogglePlay: () => void;
  onNext: () => void;
  onPrev: () => void;
  hasNext: boolean;
  hasPrev: boolean;
  isRepeating: boolean;
  onToggleRepeat: () => void;
  isShuffling: boolean;
  onToggleShuffle: () => void;
}

export interface TrackInfoProps {
  currentTrack: Track;
}

export interface VideoPlayerProps {
  videoId: string;
  title: string;
  showVideo: boolean;
  onClose: () => void;
  onReady: YouTubeProps["onReady"];
  onStateChange: YouTubeProps["onStateChange"];
  opts: YouTubeProps["opts"];
}

export interface VolumeControlProps {
  volume: number;
  isMuted: boolean;
  onVolumeChange: (val: number) => void;
  onToggleMute: () => void;
}

export interface ProgressBarProps {
  currentTime: number;
  duration: number;
  buffered: number;
  onSeek: (time: number) => void;
}
