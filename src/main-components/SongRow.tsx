"use client";

import { useCallback, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import InstantLink from "@/components/ui/InstantLink";
import { FaPlay, FaPause } from "react-icons/fa6";
import { IoDiscOutline } from "react-icons/io5";
import { usePlayerCore } from "@/context/PlayerContext";
import { useRatingsContext } from "@/context/RatingsContext";
import { lyricsQueryOptions, useLyrics } from "@/hooks/useLyrics";
import { Track, AlbumContext } from "@/types/music";
import { createSlug } from "@/lib/utils";
import PlaylistSelectorModal from "@/components/ui/PlaylistSelectorModal";
import MainModal, { MainModalHeader } from "@/components/ui/MainModal";
import SongRowLyrics from "./SongRowLyrics";
import SongRowDropdown from "./SongRowDropdown";
import SongRowRating from "./SongRowRating";

async function copyTextToClipboard(text: string) {
  if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }

  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "true");
  textarea.style.position = "fixed";
  textarea.style.left = "-9999px";
  textarea.style.top = "0";
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand("copy");
  document.body.removeChild(textarea);
}

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
  queue?: Track[];
  onRate?: (rating: number) => void;
  onAddToPlaylist?: () => void;
  onShare?: () => void;
  /** Show album name in the subline before duration (default: true) */
  showAlbumInSubline?: boolean;
  onFavoriteChange?: (isFavorite: boolean) => void;
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
  queue,
  onRate,
  onAddToPlaylist,
  onShare,
  showAlbumInSubline = true,
  onFavoriteChange,
}: SongRowProps) {
  const [hovered, setHovered] = useState(false);
  const [showPlaylistModal, setShowPlaylistModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [lyricsFontSize, setLyricsFontSize] = useState(18);

  const {
    currentTrack,
    isPlaying: isPlayerPlaying,
    isLoading,
    playTrack,
    currentLyricsTrackId,
    setCurrentLyricsTrackId,
  } = usePlayerCore();
  const isCurrentTrack = currentTrack?.id === track?.id;

  const { ratings, publicAlbumRatings } = useRatingsContext();
  const trackId = track?.id;
  const lyricsOpen = currentLyricsTrackId === trackId;
  const contextRating = trackId ? (ratings[trackId] ?? 0) : 0;
  const displayRating = rating ?? contextRating;

  const effectiveArtistId = track?.artistId ?? artistId;
  const effectiveAlbumId = track?.albumId ?? albumId;
  const publicRating = effectiveAlbumId
    ? (publicAlbumRatings[effectiveAlbumId]?.averageRating ?? null)
    : null;

  const queryClient = useQueryClient();
  const prefetchLyrics = useCallback(() => {
    queryClient.prefetchQuery(lyricsQueryOptions(title, artist, track?.length));
  }, [queryClient, title, artist, track?.length]);

  const { data: lyricsData, isLoading: lyricsLoading } = useLyrics(
    title,
    artist,
    track?.length,
    lyricsOpen,
  );

  const shareUrl = typeof window !== "undefined" ? window.location.href : "";
  const [shareCopied, setShareCopied] = useState(false);

  const formatDuration = (val: string) => {
    if (!val || val === "—") return "--:--";
    const num = Number(val);
    if (!isNaN(num) && num > 0) {
      const ms = num > 1000 ? num : num * 1000;
      const minutes = Math.floor(ms / 60000);
      const seconds = Math.floor((ms % 60000) / 1000);
      return `${minutes}:${seconds.toString().padStart(2, "0")}`;
    }
    return val;
  };

  const resolvedArtworkUrl =
    track?.albumImageUrl || artworkUrl || albumContext?.artworkUrl || undefined;

  const handlePlay = useCallback(() => {
    if (track) {
      playTrack(
        {
          ...track,
          albumImageUrl: resolvedArtworkUrl,
          albumId: track.albumId ?? albumId ?? albumContext?.albumId,
          albumTitle: track.albumTitle ?? albumContext?.title ?? album,
          artistName: track.artistName ?? artist,
          artistId: track.artistId ?? effectiveArtistId,
          releaseDate: track.releaseDate ?? albumContext?.releaseDate,
          totalTracks: track.totalTracks ?? albumContext?.totalTracks,
        },
        queue,
      );
    } else if (onPlay) {
      onPlay();
    }
  }, [
    track,
    resolvedArtworkUrl,
    albumId,
    albumContext,
    album,
    artist,
    effectiveArtistId,
    queue,
    playTrack,
    onPlay,
  ]);

  const displayAlbum =
    album || track?.albumTitle || albumContext?.title || "Unknown Album";
  const durationMsForFavorite = (() => {
    if (track?.length && Number(track.length) > 0) return Number(track.length);
    if (!duration) return undefined;
    const colonMatch = duration.match(/^(\d+):(\d{1,2})$/);
    if (colonMatch) {
      const mins = Number(colonMatch[1]);
      const secs = Number(colonMatch[2]);
      if (!Number.isNaN(mins) && !Number.isNaN(secs)) {
        return (mins * 60 + secs) * 1000;
      }
    }
    const numeric = Number(duration);
    if (!Number.isNaN(numeric) && numeric > 0) {
      return numeric > 1000 ? numeric : numeric * 1000;
    }
    return undefined;
  })();

  return (
    <div
      className="group flex w-full min-w-0 flex-col rounded-lg border border-neutral-100 bg-white transition-colors duration-200 ease-in-out hover:border-neutral-300/90"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="flex w-full min-w-0 items-center gap-1.5 px-1.5 py-2 sm:gap-3 sm:px-3 sm:py-2.5">
        {/* Left Section */}
        <div className="flex min-w-0 flex-1 items-center gap-1.5 sm:gap-3">
          <div className="flex shrink-0 items-center gap-1 sm:gap-3">
            {/* Track Number / Play Icon */}
            <div className="flex w-5 shrink-0 items-center justify-center sm:w-8">
              {hovered || isCurrentTrack ? (
                <button
                  onClick={handlePlay}
                  className="flex h-6 w-6 items-center justify-center rounded-full bg-neutral-800 text-neutral-100 transition-all hover:bg-neutral-700 sm:h-7 sm:w-7"
                  aria-label={
                    isCurrentTrack && isPlayerPlaying ? "Pause" : "Play"
                  }
                >
                  {isCurrentTrack && isLoading ? (
                    <span className="animate-pulse text-[10px]">...</span>
                  ) : isCurrentTrack && isPlayerPlaying ? (
                    <>
                      <FaPause size={10} className="sm:hidden" />
                      <FaPause size={12} className="hidden sm:block" />
                    </>
                  ) : (
                    <>
                      <FaPlay size={10} className="ml-0.5 sm:hidden" />
                      <FaPlay size={12} className="ml-0.5 hidden sm:block" />
                    </>
                  )}
                </button>
              ) : (
                <span className="w-5 text-center font-mono text-[10px] text-neutral-400 sm:w-8 sm:text-xs">
                  {index}
                </span>
              )}
            </div>

            {/* Album Art */}
            <div className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded bg-neutral-200 sm:h-10 sm:w-10 sm:rounded-md">
              {artworkUrl ? (
                <img
                  src={artworkUrl}
                  alt={album}
                  loading="lazy"
                  decoding="async"
                  className="h-full w-full object-cover"
                />
              ) : (
                <IoDiscOutline className="text-neutral-400" size={16} />
              )}
            </div>
          </div>

          {/* Song Info */}
          <div className="flex min-w-0 flex-1 flex-col justify-center gap-0 sm:gap-0.5">
            <div className="flex min-w-0 items-center">
              {effectiveAlbumId ? (
                <InstantLink
                  href={`/album/${effectiveAlbumId}`}
                  className="min-w-0 flex-1 truncate text-xs font-semibold text-neutral-900 hover:underline sm:text-base"
                  title={title}
                >
                  {title}
                </InstantLink>
              ) : (
                <span
                  className="min-w-0 flex-1 truncate text-xs font-semibold text-neutral-900 sm:text-base"
                  title={title}
                >
                  {title}
                </span>
              )}
            </div>

            <div className="flex min-w-0 items-center gap-x-1 truncate text-[11px] text-neutral-500 sm:text-xs">
              <span className="min-w-0 truncate">
                {(track?.artists?.length
                  ? track.artists
                  : [{ id: effectiveArtistId, name: artist }]
                ).map((a, i) => (
                  <span
                    key={`${a.id || "noid"}-${i}-${a.name}`}
                    className="inline"
                  >
                    {i > 0 && (
                      <span className="font-mono tracking-tight text-neutral-400">
                        {" "}
                        ft.{" "}
                      </span>
                    )}
                    {a.id ? (
                      <InstantLink
                        href={`/artist/${createSlug(a.name, a.id)}`}
                        className="hover:text-neutral-700 hover:underline"
                      >
                        {a.name}
                      </InstantLink>
                    ) : (
                      <span>{a.name}</span>
                    )}
                  </span>
                ))}
              </span>
              {showAlbumInSubline ? (
                <>
                  <span className="hidden shrink-0 text-neutral-300 sm:inline">
                    •
                  </span>
                  {effectiveAlbumId ? (
                    <InstantLink
                      href={`/album/${effectiveAlbumId}`}
                      className="hidden min-w-0 max-w-48 shrink truncate hover:text-neutral-700 hover:underline sm:inline"
                    >
                      {displayAlbum}
                    </InstantLink>
                  ) : (
                    <span className="hidden min-w-0 max-w-48 shrink truncate sm:inline">
                      {displayAlbum}
                    </span>
                  )}
                </>
              ) : null}
              <span className="shrink-0 text-neutral-300">•</span>
              <span className="shrink-0 tabular-nums">
                {formatDuration(duration)}
              </span>
            </div>
          </div>
        </div>

        {/* Right Section */}
        <div className="flex shrink-0 items-center gap-0.5 sm:gap-1.5">
          {/* Duration */}

          {/* Rating Circle */}
          <SongRowRating
            trackId={trackId}
            albumContext={albumContext}
            displayRating={displayRating}
            publicRating={publicRating}
            onRate={onRate}
          />

          {/* Three Dots Menu */}
          <SongRowDropdown
            isLyricsOpen={lyricsOpen}
            onToggleLyrics={() =>
              setCurrentLyricsTrackId(lyricsOpen ? null : trackId || null)
            }
            onAddToPlaylist={() => setShowPlaylistModal(true)}
            onPrefetchLyrics={prefetchLyrics}
            onShare={() => {
              setShowShareModal(true);
              onShare?.();
            }}
            trackId={trackId}
            trackName={title}
            artistName={artist}
            thumbnailUrl={artworkUrl}
            albumId={effectiveAlbumId}
            albumName={displayAlbum}
            durationMs={durationMsForFavorite}
            artistId={effectiveArtistId}
            artists={track?.artists}
            onFavoriteChange={onFavoriteChange}
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

      {showShareModal && (
        <MainModal
          onClose={() => setShowShareModal(false)}
          maxWidthClassName="max-w-md"
        >
          <MainModalHeader
            title="Share"
            onClose={() => setShowShareModal(false)}
          />

          <div className="p-6">
            <div className="text-xs uppercase tracking-widest font-mono text-neutral-400 mb-3">
              Copy link
            </div>
            <div className="flex items-center gap-2">
              <input
                value={shareUrl}
                readOnly
                className="flex-1 min-w-0 rounded-xl border border-neutral-200 bg-neutral-100 px-4 py-3 text-xs font-mono text-neutral-800 outline-none"
              />
              <button
                type="button"
                onClick={async () => {
                  await copyTextToClipboard(shareUrl);
                  setShareCopied(true);
                  window.setTimeout(() => setShareCopied(false), 900);
                }}
                className="shrink-0 rounded-xl border border-neutral-200 bg-white px-4 py-3 text-xs font-mono text-neutral-700 hover:text-neutral-900 hover:bg-neutral-50 transition-colors"
                disabled={!shareUrl}
              >
                {shareCopied ? "Copied" : "Copy"}
              </button>
            </div>
          </div>
        </MainModal>
      )}
    </div>
  );
}
