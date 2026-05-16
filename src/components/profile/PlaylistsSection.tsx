"use client";

import { useEffect } from "react";
import Link from "next/link";
import { FaListUl, FaCompactDisc } from "react-icons/fa";
import { usePlaylist } from "@/context/PlaylistContext";

interface PlaylistsSectionProps {
  className?: string;
}

export default function PlaylistsSection({
  className = "",
}: PlaylistsSectionProps) {
  const { playlists, loading, fetchPlaylists } = usePlaylist();

  useEffect(() => {
    fetchPlaylists();
  }, [fetchPlaylists]);

  return (
    <div className={className}>
      <div className="flex items-center gap-3 mb-6">
        <div className="w-1 h-5 bg-[#1f1f1f]" />
        <h2 className="text-lg font-light tracking-tight text-neutral-900">
          Playlists
        </h2>
        <span className="text-xs text-neutral-600 font-mono">
          {playlists.length}
        </span>
      </div>

      {loading ? (
        <div className="py-8 flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-neutral-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : playlists.length === 0 ? (
        <div className="py-12 text-center border border-[#e1e1e1] bg-white rounded-md">
          <FaListUl size={24} className="text-neutral-700 mx-auto mb-3" />
          <p className="text-neutral-600 font-mono text-sm">No playlists yet</p>
          <p className="text-neutral-700 text-xs mt-1">
            Add songs or albums to a playlist from any album page
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {playlists.map((playlist) => (
            <Link
              key={playlist.id}
              href={`/playlist/${playlist.id}`}
              className="group p-4 bg-white border border-[#e1e1e1] hover:border-[#cbcbcb] hover:bg-[#f8f8f8] transition-all duration-200 text-left rounded-md"
            >
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 flex items-center justify-center bg-[#efefef] shrink-0 group-hover:bg-[#e4e4e4] transition-colors rounded-sm">
                  {playlist.type === "albums" ? (
                    <FaCompactDisc
                      size={20}
                      className="text-neutral-500 group-hover:text-neutral-900"
                    />
                  ) : (
                    <FaListUl
                      size={20}
                      className="text-neutral-500 group-hover:text-neutral-900"
                    />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm text-neutral-900 truncate group-hover:text-black transition-colors">
                      {playlist.name}
                    </h3>
                    <span className="text-[9px] uppercase tracking-wider text-neutral-600 font-mono bg-neutral-200 px-1.5 py-0.5 rounded shrink-0">
                      {playlist.type === "albums" ? "Albums" : "Songs"}
                    </span>
                  </div>

                  <p className="text-xs text-neutral-600 font-mono mt-1">
                    {new Date(playlist.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
