"use client";

import { useState } from "react";
import Link from "next/link";
import { FaPlay, FaPause } from "react-icons/fa6";
import { IoDiscOutline } from "react-icons/io5";
import { usePlayer } from "@/context/PlayerContext";
import { useRatingsContext } from "@/context/RatingsContext";
import { useLyrics } from "@/hooks/useLyrics";
import { Track, AlbumContext } from "@/types/music";
import { createSlug } from "@/lib/utils";
import PlaylistSelectorModal from "@/components/ui/PlaylistSelectorModal";
import SongRowLyrics from "./SongRowLyrics";
import SongRowDropdown from "./SongRowDropdown";
import SongRowRating from "./SongRowRating";

interface SongRowProps {
  index: number;
  title: string;
  artist: string;
  album: string;
  duration: string;
  artworkUrl?: string | null;
  rating?: number | null;
  track?: Track;
  artistId?: string;
  albumId?: string;
  albumContext?: AlbumContext;
  onPlay?: () => void;
  onRate?: (rating: number) => void;
  onAddToPlaylist?: () => void;
  onShare?: () => void;
  onGoToAlbum?: () => void;
  onGoToArtist?: () => void;
}

export default function SongRow({
  index,
  title,
  artist,
  album,
  duration,
  artworkUrl,
  rating,
  track,
  artistId,
  albumId,
  albumContext,
  onPlay,
  onRate,
  onAddToPlaylist,
  onShare,
  onGoToAlbum,
  onGoToArtist,
}: SongRowProps) {
  const [hovered, setHovered] = useState(false);
  const [showPlaylistModal, setShowPlaylistModal] = useState(false);
  const [lyricsFontSize, setLyricsFontSize] = useState(18);

  const {
    currentTrack,
    isPlaying: isPlayerPlaying,
    isLoading,
    playTrack,
    currentLyricsTrackId,
    setCurrentLyricsTrackId,
  } = usePlayer();
  const isCurrentTrack = currentTrack?.id === track?.id;

  const { ratings } = useRatingsContext();
  const trackId = track?.id;
  const lyricsOpen = currentLyricsTrackId === trackId;
  const contextRating = trackId ? (ratings[trackId] ?? 0) : 0;
  const displayRating = rating ?? contextRating;

  const effectiveArtistId = track?.artistId ?? artistId;
  const effectiveAlbumId = track?.albumId ?? albumId;

  const { data: lyricsData, isLoading: lyricsLoading } = useLyrics(
    title,
    artist,
    track?.length,
    lyricsOpen,
  );

  const formatDuration = (val: string) => {
    if (!val) return "--:--";
    const num = Number(val);
    if (!isNaN(num) && num > 1000) {
      const minutes = Math.floor(num / 60000);
      const seconds = Math.floor((num % 60000) / 1000);
      return `${minutes}:${seconds.toString().padStart(2, "0")}`;
    }
    return val;
  };

  return (
    <div
      className="flex flex-col bg-white rounded-lg border border-neutral-100 hover:border-neutral-100 hover:bg-neutral-100 transition-colors group"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="flex items-center gap-3 px-3 py-2.5 min-w-0">
        {/* Left Section */}
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {/* Track Number / Play Icon */}
          <div className="w-8 flex-shrink-0 flex items-center justify-center">
            {hovered || isCurrentTrack ? (
              <button
                onClick={() => {
                  if (track) {
                    playTrack(track);
                  } else if (onPlay) {
                    onPlay();
                  }
                }}
                className="w-8 h-8 flex items-center justify-center rounded-full text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 transition-all"
                aria-label={
                  isCurrentTrack && isPlayerPlaying ? "Pause" : "Play"
                }
              >
                {isCurrentTrack && isLoading ? (
                  <span className="animate-pulse text-[10px]">...</span>
                ) : isCurrentTrack && isPlayerPlaying ? (
                  <FaPause size={12} />
                ) : (
                  <FaPlay size={12} className="ml-0.5" />
                )}
              </button>
            ) : (
              <span className="text-sm text-neutral-400 font-mono w-8 text-center">
                {index}
              </span>
            )}
          </div>

          {/* Album Art */}
          <div className="w-10 h-10 rounded-md bg-neutral-200 flex-shrink-0 flex items-center justify-center overflow-hidden">
            {artworkUrl ? (
              <img
                src={artworkUrl}
                alt={album}
                className="w-full h-full object-cover"
              />
            ) : (
              <IoDiscOutline className="text-neutral-400" size={20} />
            )}
          </div>

          {/* Song Info */}
          <div className="flex flex-col min-w-0">
            {effectiveAlbumId ? (
              <Link
                href={`/album/${effectiveAlbumId}`}
                className="text-sm font-semibold text-neutral-900 truncate hover:underline"
              >
                {title}
              </Link>
            ) : (
              <span className="text-sm font-semibold text-neutral-900 truncate">
                {title}
              </span>
            )}
            <div className="flex items-center gap-1 text-xs text-neutral-500 min-w-0">
              <span className="truncate min-w-0">
                {track?.artists && track.artists.length > 0 ? (
                  track.artists.map((a, i, arr) => (
                    <span key={a.id ?? `${a.name}-${i}`}>
                      {a.id ? (
                        <Link
                          href={`/artist/${createSlug(a.name, a.id)}`}
                          className="hover:underline hover:text-neutral-700"
                        >
                          {a.name}
                        </Link>
                      ) : (
                        <span>{a.name}</span>
                      )}
                      {i < arr.length - 1 && (
                        <span className="text-neutral-400">, </span>
                      )}
                    </span>
                  ))
                ) : effectiveArtistId ? (
                  <Link
                    href={`/artist/${createSlug(artist, effectiveArtistId)}`}
                    className="hover:underline hover:text-neutral-700"
                  >
                    {artist}
                  </Link>
                ) : (
                  <span>{artist}</span>
                )}
              </span>
              <span className="text-neutral-300">/</span>
              <IoDiscOutline size={10} className="text-neutral-400 shrink-0" />
              {effectiveAlbumId ? (
                <Link
                  href={`/album/${effectiveAlbumId}`}
                  className="truncate hover:underline hover:text-neutral-700"
                >
                  {album}
                </Link>
              ) : (
                <span className="truncate">{album}</span>
              )}
            </div>
          </div>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-3 shrink-0">
          {/* Duration */}
          <span className="text-xs text-neutral-500 font-mono">
            {formatDuration(duration)}
          </span>

          {/* Rating Circle */}
          <SongRowRating
            trackId={trackId}
            albumContext={albumContext}
            displayRating={displayRating}
            onRate={onRate}
          />

          {/* Three Dots Menu */}
          <SongRowDropdown
            isLyricsOpen={lyricsOpen}
            onToggleLyrics={() => setCurrentLyricsTrackId(lyricsOpen ? null : trackId || null)}
            onAddToPlaylist={() => setShowPlaylistModal(true)}
            onGoToAlbum={onGoToAlbum}
            onGoToArtist={onGoToArtist}
            onShare={onShare}
          />
        </div>
      </div>

      {/* Lyrics Accordion */}
      <SongRowLyrics
        isOpen={lyricsOpen}
        isLoading={lyricsLoading}
        lyrics={lyricsData?.lyrics}
        fontSize={lyricsFontSize}
        onIncreaseFontSize={() => setLyricsFontSize((s) => Math.min(32, s + 2))}
        onDecreaseFontSize={() => setLyricsFontSize((s) => Math.max(8, s - 2))}
        onClose={() => setCurrentLyricsTrackId(null)}
      />

      {/* Playlist Selector Modal */}
      {showPlaylistModal && trackId && (
        <PlaylistSelectorModal
          trackId={trackId}
          trackName={title}
          artistName={artist}
          albumName={album}
          albumId={effectiveAlbumId || ""}
          thumbnailUrl={artworkUrl || ""}
          durationMs={track?.length}
          onClose={() => setShowPlaylistModal(false)}
        />
      )}
    </div>
  );
}
