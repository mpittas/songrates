"use client";

import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState, type RefObject } from "react";
import { createPortal } from "react-dom";
import { LuPause, LuPlay } from "react-icons/lu";
import { usePlayerCore } from "@/context/PlayerContext";
import { useRatingsContext as useRatings } from "@/context/RatingsContext";
import { RATING_COLORS } from "@/components/rating/constants";
import { AlbumInfo, Track } from "@/types/music";
import { albumKeys } from "@/hooks/useAlbumInfo";
import { cn, formatTime } from "@/lib/utils";

interface AlbumTracklistPopoverProps {
  albumId: string;
  currentTrackId: string;
  isVisible: boolean;
  anchorRef: RefObject<HTMLElement | null>;
  onClose: () => void;
}

export default function AlbumTracklistPopover({
  albumId,
  currentTrackId,
  isVisible,
  anchorRef,
  onClose,
}: AlbumTracklistPopoverProps) {
  const { playTrack, isPlaying, queue } = usePlayerCore();
  const { ratings } = useRatings();
  const listRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0 });

  const queuedAlbumTracks = useMemo(() => {
    if (!albumId) return [];
    return queue.filter((track) => track.albumId === albumId);
  }, [albumId, queue]);

  const hasQueuedAlbum = queuedAlbumTracks.length > 1;

  const { data: album, isLoading } = useQuery({
    queryKey: albumKeys.detailLite(albumId),
    queryFn: async ({ signal }) => {
      const params = new URLSearchParams({ id: albumId, lite: "1" });
      const res = await fetch(`/api/album-info?${params.toString()}`, {
        signal,
      });
      if (!res.ok) throw new Error("Failed to fetch album");
      return (await res.json()) as AlbumInfo;
    },
    enabled: isVisible && !!albumId && !hasQueuedAlbum,
    staleTime: 10 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: 1,
  });

  const tracks: Track[] = hasQueuedAlbum
    ? queuedAlbumTracks
    : (album?.tracks ?? []).map((track) => ({
        id: track.id,
        title: track.title,
        artistName: album?.artist.name,
        artistId: album?.artist.id,
        albumId: album?.id,
        albumImageUrl: album?.artworkUrl,
        albumTitle: album?.title,
        releaseDate: album?.releaseDate,
        totalTracks: album?.tracks.length,
        length: track.length,
        number: track.number,
        artists: track.artists,
      }));

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!isVisible) return;

    const updatePos = () => {
      const anchor = anchorRef.current;
      if (!anchor) return;
      const rect = anchor.getBoundingClientRect();
      setPos({
        top: rect.top - 10,
        left: rect.left + rect.width / 2,
      });
    };

    updatePos();
    window.addEventListener("scroll", updatePos, true);
    window.addEventListener("resize", updatePos);
    return () => {
      window.removeEventListener("scroll", updatePos, true);
      window.removeEventListener("resize", updatePos);
    };
  }, [anchorRef, isVisible]);

  useEffect(() => {
    if (!isVisible) return;

    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (panelRef.current?.contains(target)) return;
      if (anchorRef.current?.contains(target)) return;
      onClose();
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [anchorRef, isVisible, onClose]);

  useEffect(() => {
    if (isVisible && album && currentTrackId && listRef.current) {
      const activeElement = listRef.current.querySelector(
        `[data-track-id="${currentTrackId}"]`,
      );
      if (activeElement) {
        activeElement.scrollIntoView({ block: "center", behavior: "smooth" });
      }
    }
  }, [isVisible, album, currentTrackId]);

  if (!isVisible || !mounted) return null;

  return createPortal(
    <div
      ref={panelRef}
      className="fixed z-[70]"
      style={{
        top: pos.top,
        left: pos.left,
        transform: "translate(-50%, -100%)",
      }}
    >
      <div className="flex max-h-96 w-80 flex-col overflow-hidden rounded-xl border border-white/10 bg-[#141414] shadow-[0_16px_40px_rgba(0,0,0,0.45)]">
        <div className="border-b border-white/10 px-3.5 py-3">
          <h3 className="truncate text-xs font-medium tracking-tight text-white">
            {!albumId
              ? "Album tracks"
              : isLoading && !hasQueuedAlbum
                ? "Loading…"
                : album?.title ||
                  queuedAlbumTracks[0]?.albumTitle ||
                  "Unknown Album"}
          </h3>
          <p className="mt-0.5 truncate text-[11px] text-white/45">
            {!albumId
              ? "No album is linked to this track"
              : isLoading && !hasQueuedAlbum
                ? " "
                : album?.artist?.name || queuedAlbumTracks[0]?.artistName}
          </p>
        </div>

        <div
          ref={listRef}
          className="flex-1 overflow-y-auto overscroll-contain"
        >
          {!albumId ? (
            <p className="px-3.5 py-6 text-center text-xs text-white/45">
              Play a song from an album to see its tracklist.
            </p>
          ) : isLoading && !hasQueuedAlbum ? (
            <div className="space-y-2 p-3">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className="h-8 animate-pulse rounded-md bg-white/10"
                />
              ))}
            </div>
          ) : tracks.length === 0 ? (
            <p className="px-3.5 py-6 text-center text-xs text-white/45">
              Couldn’t load this album’s tracks.
            </p>
          ) : (
            tracks.map((track) => {
              const isCurrent = track.id === currentTrackId;

              return (
                <button
                  key={track.id}
                  type="button"
                  data-track-id={track.id}
                  className={cn(
                    "group flex w-full items-center gap-2 px-3 py-2 text-left text-xs transition-colors",
                    isCurrent
                      ? "bg-white/8 text-white"
                      : "text-white/65 hover:bg-white/6 hover:text-white",
                  )}
                  onClick={() => {
                    playTrack(track, tracks);
                  }}
                >
                  <div className="flex w-4 shrink-0 justify-center text-[10px] tabular-nums">
                    {isCurrent ? (
                      isPlaying ? (
                        <LuPause size={10} />
                      ) : (
                        <LuPlay size={10} />
                      )
                    ) : (
                      <>
                        <span className="text-white/35 group-hover:hidden">
                          {track.number}
                        </span>
                        <span className="hidden text-white group-hover:block">
                          <LuPlay size={10} />
                        </span>
                      </>
                    )}
                  </div>

                  <span className="min-w-0 flex-1 truncate font-medium">
                    {track.title}
                  </span>

                  {track.length ? (
                    <span className="text-[10px] tabular-nums text-white/35">
                      {formatTime(track.length, "milliseconds")}
                    </span>
                  ) : null}

                  {ratings[track.id] ? (
                    <span
                      className="shrink-0 rounded px-1 py-0.5 text-[9px] tabular-nums"
                      style={{
                        backgroundColor: `${RATING_COLORS[ratings[track.id] - 1]}22`,
                        color: RATING_COLORS[ratings[track.id] - 1],
                      }}
                    >
                      {ratings[track.id]}
                    </span>
                  ) : null}
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}
