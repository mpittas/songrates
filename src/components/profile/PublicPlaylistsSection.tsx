"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { FaListUl, FaTimes, FaMusic, FaCompactDisc } from "react-icons/fa";
import { createClient } from "@/utils/supabase/client";
import { Playlist, PlaylistTrack, PlaylistAlbum } from "@/types/playlist";
import { createSlug } from "@/lib/utils";
import OptimizedImage from "@/components/ui/OptimizedImage";

interface PublicPlaylistsSectionProps {
  userId: string;
  className?: string;
}

export default function PublicPlaylistsSection({
  userId,
  className = "",
}: PublicPlaylistsSectionProps) {
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlaylist, setSelectedPlaylist] = useState<Playlist | null>(
    null,
  );
  const [playlistTracks, setPlaylistTracks] = useState<PlaylistTrack[]>([]);
  const [playlistAlbums, setPlaylistAlbums] = useState<PlaylistAlbum[]>([]);
  const [loadingItems, setLoadingItems] = useState(false);

  useEffect(() => {
    const fetchPlaylists = async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("playlists")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching public playlists:", error);
        setLoading(false);
        return;
      }

      setPlaylists(data || []);
      setLoading(false);
    };

    fetchPlaylists();
  }, [userId]);

  const handleViewPlaylist = async (playlist: Playlist) => {
    setSelectedPlaylist(playlist);
    setLoadingItems(true);
    const supabase = createClient();

    if (playlist.type === "albums") {
      const { data, error } = await supabase
        .from("playlist_albums")
        .select("*")
        .eq("playlist_id", playlist.id)
        .order("position", { ascending: true });

      if (error) {
        console.error("Error fetching playlist albums:", error);
      }
      setPlaylistAlbums(data || []);
      setPlaylistTracks([]);
    } else {
      const { data, error } = await supabase
        .from("playlist_tracks")
        .select("*")
        .eq("playlist_id", playlist.id)
        .order("position", { ascending: true });

      if (error) {
        console.error("Error fetching playlist tracks:", error);
      }
      setPlaylistTracks(data || []);
      setPlaylistAlbums([]);
    }
    setLoadingItems(false);
  };

  const formatDuration = (ms?: number | null) => {
    if (!ms) return "";
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

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
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {playlists.map((playlist) => (
            <button
              key={playlist.id}
              onClick={() => handleViewPlaylist(playlist)}
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
            </button>
          ))}
        </div>
      )}

      {/* Playlist Detail Modal (read-only) */}
      {selectedPlaylist && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedPlaylist(null)}
        >
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
          <div
            className="relative w-full max-w-lg max-h-[80vh] bg-white border border-[#e1e1e1] shadow-2xl flex flex-col rounded-lg"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#ececec] shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-1 h-5 bg-[#1f1f1f] rounded-full" />
                <div>
                  <h2 className="text-lg font-light tracking-tight text-neutral-900">
                    {selectedPlaylist.name}
                  </h2>
                  {selectedPlaylist.description && (
                    <p className="text-xs text-neutral-500">
                      {selectedPlaylist.description}
                    </p>
                  )}
                </div>
              </div>
              <button
                onClick={() => setSelectedPlaylist(null)}
                className="text-neutral-500 hover:text-neutral-900 transition-colors p-1 hover:bg-neutral-200 rounded"
              >
                <FaTimes size={16} />
              </button>
            </div>

            {/* Modal Content */}
            <div className="overflow-y-auto flex-1 p-4">
              {loadingItems ? (
                <div className="py-12 flex items-center justify-center">
                  <div className="w-6 h-6 border-2 border-neutral-500 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : selectedPlaylist.type === "albums" ? (
                /* Album Playlist Content */
                playlistAlbums.length === 0 ? (
                  <div className="py-12 text-center">
                    <FaCompactDisc
                      size={24}
                      className="text-neutral-700 mx-auto mb-3"
                    />
                    <p className="text-neutral-600 font-mono text-sm">
                      No albums in this playlist
                    </p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    {playlistAlbums.map((album, index) => {
                      const albumSlug = album.album_name
                        ? createSlug(album.album_name, album.album_id)
                        : null;
                      const href = albumSlug
                        ? `/album/${albumSlug}`
                        : undefined;

                      const albumContent = (
                        <>
                          <span className="text-xs text-neutral-600 font-mono w-5 text-center">
                            {index + 1}
                          </span>
                          <div className="relative w-10 h-10 shrink-0 bg-[#efefef] overflow-hidden rounded-sm">
                            {album.thumbnail_url ? (
                              <OptimizedImage
                                src={album.thumbnail_url}
                                alt={album.album_name || "Unknown"}
                                fill
                                className="object-cover"
                                fallbackSrc="/vinyl-placeholder.svg"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-neutral-800/80">
                                <FaCompactDisc
                                  size={14}
                                  className="text-neutral-600"
                                />
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-neutral-900 truncate group-hover:text-black transition-colors">
                              {album.album_name || "Unknown Album"}
                            </p>
                            <p className="text-xs text-neutral-500 truncate">
                              {album.artist_name || "Unknown Artist"}
                              {album.total_tracks &&
                                ` • ${album.total_tracks} tracks`}
                            </p>
                          </div>
                        </>
                      );

                      return href ? (
                        <Link
                          key={album.id}
                          href={href}
                          onClick={() => setSelectedPlaylist(null)}
                          className="group flex items-center gap-3 p-2 bg-white border border-[#e1e1e1] hover:border-[#cfcfcf] hover:bg-[#f8f8f8] rounded-sm transition-all duration-200"
                        >
                          {albumContent}
                        </Link>
                      ) : (
                        <div
                          key={album.id}
                          className="group flex items-center gap-3 p-2 bg-white border border-[#e1e1e1] hover:border-[#cfcfcf] rounded-sm"
                        >
                          {albumContent}
                        </div>
                      );
                    })}
                  </div>
                )
              ) : /* Song Playlist Content */
              playlistTracks.length === 0 ? (
                <div className="py-12 text-center">
                  <FaMusic
                    size={24}
                    className="text-neutral-700 mx-auto mb-3"
                  />
                  <p className="text-neutral-600 font-mono text-sm">
                    No tracks in this playlist
                  </p>
                </div>
              ) : (
                <div className="space-y-1">
                  {playlistTracks.map((track, index) => {
                    const albumSlug =
                      track.album_id && track.album_name
                        ? createSlug(track.album_name, track.album_id)
                        : null;
                    const href = albumSlug
                      ? `/album/${albumSlug}?track=${track.track_id}`
                      : undefined;

                    const trackContent = (
                      <>
                        <span className="text-xs text-neutral-600 font-mono w-5 text-center">
                          {index + 1}
                        </span>
                        <div className="relative w-10 h-10 shrink-0 bg-[#efefef] overflow-hidden rounded-sm">
                          {track.thumbnail_url ? (
                            <OptimizedImage
                              src={track.thumbnail_url}
                              alt={track.track_name || "Unknown"}
                              fill
                              className="object-cover"
                              fallbackSrc="/vinyl-placeholder.svg"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-neutral-800/80">
                              <FaMusic size={14} className="text-neutral-600" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-neutral-900 truncate group-hover:text-black transition-colors">
                            {track.track_name || "Unknown Track"}
                          </p>
                          <p className="text-xs text-neutral-500 truncate">
                            {track.artist_name || "Unknown Artist"}
                            {track.album_name && ` • ${track.album_name}`}
                          </p>
                        </div>
                        <span className="text-xs text-neutral-600 font-mono">
                          {formatDuration(track.duration_ms)}
                        </span>
                      </>
                    );

                    return href ? (
                      <Link
                        key={track.id}
                        href={href}
                        onClick={() => setSelectedPlaylist(null)}
                        className="group flex items-center gap-3 p-2 bg-white border border-[#e1e1e1] hover:border-[#cfcfcf] hover:bg-[#f8f8f8] rounded-sm transition-all duration-200"
                      >
                        {trackContent}
                      </Link>
                    ) : (
                      <div
                        key={track.id}
                        className="group flex items-center gap-3 p-2 bg-white border border-[#e1e1e1] hover:border-[#cfcfcf] rounded-sm"
                      >
                        {trackContent}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3 border-t border-[#ececec] shrink-0">
              <p className="text-xs text-neutral-600 font-mono">
                {selectedPlaylist.type === "albums"
                  ? `${playlistAlbums.length} albums`
                  : `${playlistTracks.length} tracks`}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
