"use client";

import { useCallback, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
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

function truncateText(text: string, maxChars: number) {
  const s = (text || "").trim();
  if (s.length <= maxChars) return s;
  return `${s.slice(0, Math.max(0, maxChars - 1))}…`;
}

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
  onRate?: (rating: number) => void;
  onAddToPlaylist?: () => void;
  onShare?: () => void;
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

  const shareUrl =
    typeof window !== "undefined" ? window.location.href : "";
  const [shareCopied, setShareCopied] = useState(false);

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
      className="flex flex-col bg-white rounded-lg border border-neutral-100 hover:border-neutral-300/90 group transition-colors duration-200 ease-in-out"
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
                className="w-8 h-8 flex items-center justify-center rounded-full text-neutral-100 bg-neutral-800 hover:bg-neutral-700 transition-all"
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
              <span className="text-xs text-neutral-400 font-mono w-8 text-center">
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
            <div className="flex items-center gap-x-2">
              {effectiveAlbumId ? (
              <Link
                href={`/album/${effectiveAlbumId}`}
                className="text-sm font-bold text-neutral-900 truncate hover:underline"
              >
                {truncateText(title, 80)}
              </Link>
            ) : (
              <span className="text-sm font-semibold text-neutral-900 truncate">
                {truncateText(title, 80)}
              </span>
            )}
            
           
            </div>
            <div className="flex min-w-0 w-full flex-wrap items-center gap-x-1 gap-y-0.5 text-xs text-neutral-500">
              <span className="inline-flex min-w-0 max-w-full flex-wrap items-center gap-x-0">
                {track?.artists && track.artists.length > 0 ? (
                  track.artists.map((a, i) => (
                    <span
                      key={`${a.id || "noid"}-${i}-${a.name}`}
                      className="inline-flex items-center"
                    >
                      {i > 0 ? (
                        <span className="px-1 text-[10px] font-mono tracking-tight text-neutral-400">
                          ft.
                        </span>
                      ) : null}
                      {a.id ? (
                        <Link
                          href={`/artist/${createSlug(a.name, a.id)}`}
                          className="shrink-0 hover:text-neutral-700 hover:underline"
                        >
                          {truncateText(a.name, 50)}
                        </Link>
                      ) : (
                        <span className="shrink-0">
                          {truncateText(a.name, 50)}
                        </span>
                      )}
                    </span>
                  ))
                ) : effectiveArtistId ? (
                  <Link
                    href={`/artist/${createSlug(artist, effectiveArtistId)}`}
                    className="shrink-0 hover:text-neutral-700 hover:underline"
                  >
                    {truncateText(artist, 50)}
                  </Link>
                ) : (
                  <span className="min-w-0">{truncateText(artist, 50)}</span>
                )}
              </span>
              <span className="text-neutral-300">/</span>
              <IoDiscOutline size={10} className="text-neutral-400 shrink-0" />
              <span className="truncate min-w-0">
                {effectiveAlbumId ? (
                  <Link
                    href={`/album/${effectiveAlbumId}`}
                    className="hover:underline hover:text-neutral-700"
                  >
                    {truncateText(album, 50)}
                  </Link>
                ) : (
                  <span>{truncateText(album, 50)}</span>
                )}
              </span>
              <span className="text-neutral-300">/</span>
              <div className="text-xs text-neutral-500">
                {formatDuration(duration)}
              </div>
            </div>
          </div>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-1.5 shrink-0">
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
            onToggleLyrics={() => setCurrentLyricsTrackId(lyricsOpen ? null : trackId || null)}
            onAddToPlaylist={() => setShowPlaylistModal(true)}
            onPrefetchLyrics={prefetchLyrics}
            onShare={() => {
              setShowShareModal(true);
              onShare?.();
            }}
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
