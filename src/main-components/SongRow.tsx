"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import InstantLink from "@/components/ui/InstantLink";
import { FaPlay, FaPause } from "react-icons/fa6";
import { IoDiscOutline } from "react-icons/io5";
import { usePlayerCore } from "@/context/PlayerContext";
import { useRatingsContext } from "@/context/RatingsContext";
import { lyricsQueryOptions, useLyrics } from "@/hooks/useLyrics";
import { Track, AlbumContext } from "@/types/music";
import type { PlaybackSource } from "@/types/player";
import { cn, createSlug } from "@/lib/utils";
import PlaylistSelectorModal from "@/components/ui/PlaylistSelectorModal";
import MainModal, { MainModalHeader } from "@/components/ui/MainModal";
import Button from "@/components/ui/Button";
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

/** Animated bars shown on the artwork of the track that is playing. */
function EqualizerBars() {
  return (
    <span className="flex h-3.5 items-end gap-[2px]">
      {[0, 0.25, 0.5].map((delay) => (
        <span
          key={delay}
          className="eq-bar h-full w-[3px] rounded-full bg-current"
          style={{ animationDelay: `${-delay}s` }}
        />
      ))}
    </span>
  );
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
  playbackSource?: PlaybackSource;
  onRate?: (rating: number) => void;
  onAddToPlaylist?: () => void;
  onShare?: () => void;
  /** Show album name in the subline before duration (default: true) */
  showAlbumInSubline?: boolean;
  onFavoriteChange?: (isFavorite: boolean) => void;
  /** When true, scroll into view and pulse-highlight this track (search / share links) */
  highlighted?: boolean;
  /** Hide the cover thumbnail (album pages, where every row shares one cover).
   *  The track number becomes the play button instead. */
  showArtwork?: boolean;
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
  playbackSource,
  onRate,
  onAddToPlaylist,
  onShare,
  showAlbumInSubline = true,
  onFavoriteChange,
  highlighted = false,
  showArtwork = true,
}: SongRowProps) {
  const rowRef = useRef<HTMLDivElement>(null);
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

  const { ratings, publicTrackRatings, ensurePublicTrackRatings } =
    useRatingsContext();
  const trackId = track?.id;
  const lyricsOpen = currentLyricsTrackId === trackId;
  const contextRating = trackId ? (ratings[trackId] ?? 0) : 0;
  const displayRating = rating ?? contextRating;

  const effectiveArtistId = track?.artistId ?? artistId;
  const effectiveAlbumId = track?.albumId ?? albumId;
  const publicRating = trackId
    ? (publicTrackRatings[trackId]?.averageRating ?? null)
    : null;

  useEffect(() => {
    if (!trackId) return;
    void ensurePublicTrackRatings([trackId]);
  }, [trackId, ensurePublicTrackRatings]);

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
        playbackSource,
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
    playbackSource,
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

  useEffect(() => {
    if (!highlighted) return;
    const node = rowRef.current;
    if (!node) return;

    const scrollToTrack = () => {
      node.scrollIntoView({ behavior: "smooth", block: "center" });
    };

    // Next.js may still be settling layout after client navigation.
    const timer = window.setTimeout(scrollToTrack, 150);
    const retry = window.setTimeout(scrollToTrack, 500);
    return () => {
      window.clearTimeout(timer);
      window.clearTimeout(retry);
    };
  }, [highlighted]);

  const artistLinks = (
    track?.artists?.length
      ? track.artists
      : [{ id: effectiveArtistId, name: artist }]
  ).map((a, i) => (
    <span key={`${a.id || "noid"}-${i}-${a.name}`} className="inline">
      {i > 0 && <span className="text-ink-3"> ft. </span>}
      {a.id ? (
        <InstantLink
          href={`/artist/${createSlug(a.name, a.id)}`}
          className="transition-colors hover:text-ink hover:underline"
        >
          {a.name}
        </InstantLink>
      ) : (
        <span>{a.name}</span>
      )}
    </span>
  ));

  const showArtOverlay = hovered || isCurrentTrack;
  const playLabel =
    isCurrentTrack && isPlayerPlaying ? `Pause ${title}` : `Play ${title}`;
  const formattedDuration = formatDuration(duration);

  return (
    <div
      ref={rowRef}
      className={cn(
        "group/row relative flex w-full min-w-0 flex-col transition-colors duration-150 hover:bg-ink/[0.025]",
        highlighted && "animate-highlight-track",
      )}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="flex w-full min-w-0 items-center gap-3 py-2 pr-2 pl-3 sm:gap-4 sm:py-2.5 sm:pr-3 sm:pl-4">
        {showArtwork ? (
          <>
            {/* Track number */}
            <span
              className={cn(
                "w-5 shrink-0 text-center text-[13px] font-medium tabular-nums sm:w-6",
                isCurrentTrack ? "text-accent" : "text-ink-3",
              )}
            >
              {index}
            </span>

            {/* Artwork doubles as the play button */}
            <button
              type="button"
              onClick={handlePlay}
              className="relative flex size-11 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-md bg-subtle shadow-[inset_0_0_0_1px_rgb(0_0_0/0.05)] sm:size-12"
              aria-label={playLabel}
            >
              {artworkUrl ? (
                <img
                  src={artworkUrl}
                  alt=""
                  loading="lazy"
                  decoding="async"
                  className="h-full w-full object-cover"
                />
              ) : (
                <IoDiscOutline className="text-ink-3" size={18} />
              )}
              <span
                aria-hidden
                className={cn(
                  "absolute inset-0 flex items-center justify-center bg-black/45 text-white transition-opacity duration-150",
                  showArtOverlay ? "opacity-100" : "opacity-0",
                )}
              >
                {isCurrentTrack && isLoading ? (
                  <span className="size-3 animate-pulse rounded-full bg-white/80" />
                ) : isCurrentTrack && isPlayerPlaying ? (
                  hovered ? (
                    <FaPause size={13} />
                  ) : (
                    <EqualizerBars />
                  )
                ) : (
                  <FaPlay size={12} className="ml-0.5" />
                )}
              </span>
            </button>
          </>
        ) : (
          /* Track number doubles as the play button */
          <button
            type="button"
            onClick={handlePlay}
            aria-label={playLabel}
            className={cn(
              "-ml-1 flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-full text-[13px] font-medium tabular-nums transition-colors hover:bg-ink/[0.06]",
              isCurrentTrack ? "text-accent" : "text-ink-3",
            )}
          >
            {isCurrentTrack && isLoading ? (
              <span className="size-2.5 animate-pulse rounded-full bg-current" />
            ) : isCurrentTrack && isPlayerPlaying ? (
              hovered ? (
                <FaPause size={12} className="text-ink" />
              ) : (
                <EqualizerBars />
              )
            ) : showArtOverlay ? (
              <FaPlay size={11} className="ml-0.5 text-ink" />
            ) : (
              index
            )}
          </button>
        )}

        {/* Song info */}
        <div className="flex min-w-0 flex-1 flex-col justify-center">
          {effectiveAlbumId ? (
            <InstantLink
              href={`/album/${effectiveAlbumId}`}
              className={cn(
                "block truncate text-[14px] leading-5 font-medium tracking-[-0.01em] hover:underline sm:text-[15px]",
                isCurrentTrack ? "text-accent" : "text-ink",
              )}
              title={title}
            >
              {title}
            </InstantLink>
          ) : (
            <span
              className={cn(
                "block truncate text-[14px] leading-5 font-medium tracking-[-0.01em] sm:text-[15px]",
                isCurrentTrack ? "text-accent" : "text-ink",
              )}
              title={title}
            >
              {title}
            </span>
          )}

          <div className="flex min-w-0 items-center gap-x-1.5 truncate text-[12.5px] leading-5 text-ink-2 sm:text-[13px]">
            <span className="min-w-0 truncate">{artistLinks}</span>
            {showAlbumInSubline ? (
              <>
                <span
                  aria-hidden
                  className="hidden shrink-0 text-ink-3/60 sm:inline"
                >
                  ·
                </span>
                {effectiveAlbumId ? (
                  <InstantLink
                    href={`/album/${effectiveAlbumId}`}
                    className="hidden max-w-56 min-w-0 shrink truncate transition-colors hover:text-ink hover:underline sm:inline"
                  >
                    {displayAlbum}
                  </InstantLink>
                ) : (
                  <span className="hidden max-w-56 min-w-0 shrink truncate sm:inline">
                    {displayAlbum}
                  </span>
                )}
              </>
            ) : null}
            <span aria-hidden className="shrink-0 text-ink-3/60 sm:hidden">
              ·
            </span>
            <span className="shrink-0 tabular-nums sm:hidden">
              {formattedDuration}
            </span>
          </div>
        </div>

        {/* Duration column (desktop) */}
        <span className="hidden min-w-12 shrink-0 text-right text-[13px] whitespace-nowrap text-ink-3 tabular-nums sm:block">
          {formattedDuration}
        </span>

        {/* Ratings + menu */}
        <div className="flex shrink-0 items-center gap-1 sm:gap-1.5">
          <SongRowRating
            trackId={trackId}
            albumContext={albumContext}
            displayRating={displayRating}
            publicRating={publicRating}
            onRate={onRate}
          />

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
            <div className="mb-3 text-sm font-medium text-ink-2">Copy link</div>
            <div className="flex items-center gap-2">
              <input
                value={shareUrl}
                readOnly
                className="h-10 min-w-0 flex-1 rounded-full bg-ink/[0.05] px-4 font-mono text-xs text-ink outline-none"
              />
              <Button
                variant="primary"
                size="md"
                onClick={async () => {
                  await copyTextToClipboard(shareUrl);
                  setShareCopied(true);
                  window.setTimeout(() => setShareCopied(false), 900);
                }}
                disabled={!shareUrl}
                className="min-w-20"
              >
                {shareCopied ? "Copied" : "Copy"}
              </Button>
            </div>
          </div>
        </MainModal>
      )}
    </div>
  );
}
