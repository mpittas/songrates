"use client";

import { useQuery } from "@tanstack/react-query";
import { formatTime } from "@/lib/utils";
import { useEffect, useRef } from "react";
import { FaPlay, FaPause } from "react-icons/fa";
import { usePlayer } from "@/context/PlayerContext";
import { useRatingsContext as useRatings } from "@/context/RatingsContext";
import { RATING_COLORS } from "@/components/rating/constants";

interface AlbumTracklistPopoverProps {
  albumId: string;
  currentTrackId: string;
  isVisible: boolean;
}

export default function AlbumTracklistPopover({
  albumId,
  currentTrackId,
  isVisible,
}: AlbumTracklistPopoverProps) {
  const { playTrack, isPlaying } = usePlayer();
  const { ratings } = useRatings();
  const listRef = useRef<HTMLDivElement>(null);

  const { data: album, isLoading } = useQuery({
    queryKey: ["album", albumId],
    queryFn: async () => {
      const res = await fetch(`/api/album-info?id=${albumId}`);
      if (!res.ok) throw new Error("Failed to fetch album");
      return res.json();
    },
    enabled: isVisible || !!albumId, // Fetch if visible OR if we have an ID (prefetch could be nice too)
  });

  // Auto-scroll to active track
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

  if (!isVisible) return null;

  return (
    <div className="absolute bottom-full left-1/2 -translate-x-1/2 translate-y-1 pb-1 z-50 group/popover">
      <div className="w-80 max-h-96 bg-[#050507] backdrop-blur-md border border-[#1a1a1f] shadow-2xl overflow-hidden flex flex-col animate-in fade-in slide-in-from-bottom-2 duration-300 origin-bottom">
        {/* Header */}
        <div className="p-3 border-b border-[#1a1a1f] bg-[#0a0a0d]">
          <h3 className="text-neutral-200 text-xs font-mono font-bold truncate">
            {isLoading ? "Loading..." : album?.title || "Unknown Album"}
          </h3>
          <p className="text-neutral-500 text-[10px] truncate">
            {isLoading ? "..." : album?.artist?.name}
          </p>
        </div>

        {/* Tracklist */}
        <div
          ref={listRef}
          className="overflow-y-auto flex-1 p-0 scrollbar-thin scrollbar-thumb-neutral-800 scrollbar-track-transparent overscroll-contain"
        >
          {isLoading ? (
            <div className="p-4 space-y-2">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-8 bg-white/5 animate-pulse rounded" />
              ))}
            </div>
          ) : (
            album?.tracks?.map((track: any) => {
              const isCurrent = track.id === currentTrackId;

              return (
                <div
                  key={track.id}
                  data-track-id={track.id}
                  className={`group flex items-center gap-2 px-3 py-2 text-xs transition-colors cursor-pointer ${
                    isCurrent
                      ? "bg-[#00f0ff]/10 text-[#00f0ff]"
                      : "text-neutral-400 hover:bg-white/5 hover:text-white"
                  }`}
                  onClick={() => {
                    playTrack({
                      id: track.id,
                      title: track.title,
                      artistName: album.artist.name,
                      artistId: album.artist.id,
                      albumId: album.id,
                      albumImageUrl:
                        album.artworkUrl || "/vinyl-placeholder.svg",
                      albumTitle: album.title,
                      releaseDate: album.releaseDate,
                      totalTracks: album.tracks?.length,
                    });
                  }}
                >
                  {/* Playing Indicator / Number */}
                  <div className="w-4 flex justify-center shrink-0 font-mono text-[10px]">
                    {isCurrent ? (
                      isPlaying ? (
                        <FaPause size={8} />
                      ) : (
                        <FaPlay size={8} />
                      )
                    ) : (
                      <span className="group-hover:hidden text-neutral-600">
                        {track.number}
                      </span>
                    )}
                    <span className="hidden group-hover:block text-neutral-300">
                      {!isCurrent && <FaPlay size={8} />}
                    </span>
                  </div>

                  {/* Track Title */}
                  <span className="truncate flex-1 font-medium">
                    {track.title}
                  </span>

                  {/* Duration */}
                  {track.length && (
                    <span className="text-[10px] font-mono opacity-60 text-neutral-400">
                      {formatTime(track.length, "milliseconds")}
                    </span>
                  )}

                  {/* Rating */}
                  {ratings[track.id] && (
                    <span
                      className="text-[9px] font-mono px-1 py-0.5 shrink-0"
                      style={{
                        backgroundColor: `${RATING_COLORS[ratings[track.id] - 1]}22`,
                        color: RATING_COLORS[ratings[track.id] - 1],
                      }}
                    >
                      {ratings[track.id]}
                    </span>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
