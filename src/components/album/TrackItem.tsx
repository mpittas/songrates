"use client";

import { useState } from "react";
import Link from "next/link";
import { FaPlay, FaPause, FaGlobe } from "react-icons/fa";
import { useRatings } from "@/hooks/useRatings";
import { usePlayer } from "@/context/PlayerContext";
import { formatTime, createSlug } from "@/lib/utils";
import ColorRating from "@/components/rating/ColorRating";
import { TrackInfo, AlbumContext } from "@/types/music";

interface TrackItemProps {
  track: TrackInfo;
  artistName: string;
  artistId: string;
  albumId: string;
  albumImageUrl: string;
  albumContext: AlbumContext;
  publicRating?: number;
  publicCount?: number;
}

export default function TrackItem({
  track,
  artistName,
  artistId,
  albumId,
  albumImageUrl,
  albumContext,
  publicRating,
  publicCount,
}: TrackItemProps) {
  const { ratings, setRating } = useRatings();
  const { currentTrack, isPlaying, isLoading, playTrack } = usePlayer();
  const rating = ratings[track.id] || 0;
  const isCurrentTrack = currentTrack?.id === track.id;

  return (
    <div className="border-b border-[#1a1a1f]">
      <div className="flex items-center justify-between py-3 group hover:bg-[#0a0a0d] px-4 transition-colors">
        <div className="flex items-center gap-4 min-w-0 flex-1">
          <span className="text-neutral-600 font-mono text-xs w-2 shrink-0 text-left">
            {track.number}
          </span>

          <button
            onClick={() =>
              playTrack({
                id: track.id,
                title: track.title,
                artistName: artistName,
                artistId: artistId,
                albumId: albumId,
                albumImageUrl: albumImageUrl || "/vinyl-placeholder.svg",
                albumTitle: albumContext.title,
                releaseDate: albumContext.releaseDate,
                totalTracks: albumContext.totalTracks,
                artists: track.artists,
              })
            }
            className={`flex items-center justify-center w-6 h-6 border shrink-0 transition-all ${
              isCurrentTrack && isPlaying
                ? "bg-[#00f0ff] border-[#00f0ff] text-[#050507]"
                : "bg-[#0a0a0d] border-[#1a1a1f] text-neutral-500 hover:bg-[#00f0ff] hover:border-[#00f0ff] hover:text-[#050507]"
            }`}
            title="Play"
          >
            {isCurrentTrack && isLoading ? (
              <span className="animate-pulse text-[8px]">...</span>
            ) : isCurrentTrack && isPlaying ? (
              <FaPause size={8} />
            ) : (
              <FaPlay size={8} className="ml-0.5" />
            )}
          </button>

          <span className="text-[10px] text-neutral-600 font-mono hidden sm:block w-5 shrink-0 text-right mr-4">
            {formatTime(track.length, "milliseconds")}
          </span>

          <div className="flex flex-col min-w-0">
            <span className="text-neutral-300 group-hover:text-[#00f0ff] transition-colors truncate text-sm">
              {track.title}
            </span>
            {track.artists && track.artists.length > 0 && (
              <span className="text-neutral-600 text-xs line-clamp-2 leading-relaxed mt-0.5">
                {track.artists
                  .filter((a) => a.id !== artistId)
                  .map((a, i, arr) => (
                    <span key={a.id}>
                      {i === 0 ? "feat. " : ""}
                      <Link
                        href={`/artist/${createSlug(a.name, a.id)}`}
                        className="hover:text-[#00f0ff] hover:underline transition-colors"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {a.name}
                      </Link>
                      {i < arr.length - 1 ? ", " : ""}
                    </span>
                  ))}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Public Rating Display */}
          {publicRating && (
            <div
              className="hidden md:flex items-center gap-1.5 opacity-60 hover:opacity-100 transition-opacity mr-2"
              title={`Public: ${publicRating} (${publicCount})`}
            >
              <FaGlobe size={10} className="text-neutral-500" />
              <span className="text-[10px] font-mono text-neutral-400">
                {publicRating}
              </span>
            </div>
          )}

          <ColorRating
            rating={rating}
            onRate={(val) => setRating(track.id, val, albumContext)}
          />
        </div>
      </div>
    </div>
  );
}
