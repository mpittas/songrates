import { Track } from "./music";

export interface PlayerContextType {
  currentTrack: Track | null;
  videoId: string | null;
  isPlaying: boolean;
  isLoading: boolean;
  currentTime: number;
  duration: number;
  buffered: number;
  setIsPlaying: (playing: boolean) => void;
  playTrack: (track: Track) => Promise<void>;
  stopPlayback: () => void;
  pausePlayback: () => void;
  togglePlayPause: () => void;
  seekTo: (seconds: number) => void;
  setPlayerRef: (player: any) => void;
  updateProgress: (current: number, total: number, buffered?: number) => void;
}

export interface PlaybackControlsProps {
  isPlaying: boolean;
  isLoading: boolean;
  hasVideoId: boolean;
  onTogglePlay: () => void;
}

export interface TrackInfoProps {
  currentTrack: Track;
}

export interface VideoPlayerProps {
  videoId: string;
  title: string;
  showVideo: boolean;
  onClose: () => void;
  onReady: any;
  onStateChange: any;
  opts: any;
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
