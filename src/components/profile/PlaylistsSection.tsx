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
        <div className="w-1 h-5 bg-[#00f0ff]" />
        <h2 className="text-lg font-light tracking-tight text-white">
          Playlists
        </h2>
        <span className="text-xs text-neutral-600 font-mono">
          {playlists.length}
        </span>
      </div>

      {loading ? (
        <div className="py-8 flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-[#00f0ff] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : playlists.length === 0 ? (
        <div className="py-12 text-center border border-white/[0.04] bg-neutral-900/20">
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
              className="group p-4 bg-neutral-900/30 border border-white/[0.04] hover:border-[#00f0ff]/20 hover:bg-neutral-900/50 transition-all duration-200 text-left"
            >
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 flex items-center justify-center bg-neutral-800 shrink-0 group-hover:bg-neutral-700 transition-colors">
                  {playlist.type === "albums" ? (
                    <FaCompactDisc
                      size={20}
                      className="text-neutral-500 group-hover:text-[#00f0ff]"
                    />
                  ) : (
                    <FaListUl
                      size={20}
                      className="text-neutral-500 group-hover:text-[#00f0ff]"
                    />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm text-white truncate group-hover:text-[#00f0ff] transition-colors">
                      {playlist.name}
                    </h3>
                    <span className="text-[9px] uppercase tracking-wider text-neutral-600 font-mono bg-neutral-800 px-1.5 py-0.5 rounded shrink-0">
                      {playlist.type === "albums" ? "Albums" : "Songs"}
                    </span>
                  </div>
                  {playlist.description && (
                    <p className="text-xs text-neutral-500 truncate mt-0.5">
                      {playlist.description}
                    </p>
                  )}
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
