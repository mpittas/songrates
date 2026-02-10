"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  FaListUl,
  FaTimes,
  FaMusic,
  FaTrash,
  FaCompactDisc,
} from "react-icons/fa";
import { usePlaylist } from "@/context/PlaylistContext";
import { Playlist, PlaylistTrack, PlaylistAlbum } from "@/types/playlist";
import { createSlug } from "@/lib/utils";
import Button from "@/components/ui/Button";
import OptimizedImage from "@/components/ui/OptimizedImage";

interface PlaylistsSectionProps {
  className?: string;
}

export default function PlaylistsSection({
  className = "",
}: PlaylistsSectionProps) {
  const {
    playlists,
    loading,
    fetchPlaylists,
    deletePlaylist,
    getPlaylistTracks,
    removeTrackFromPlaylist,
    getPlaylistAlbums,
    removeAlbumFromPlaylist,
  } = usePlaylist();
  const [selectedPlaylist, setSelectedPlaylist] = useState<Playlist | null>(
    null,
  );
  const [playlistTracks, setPlaylistTracks] = useState<PlaylistTrack[]>([]);
  const [playlistAlbums, setPlaylistAlbums] = useState<PlaylistAlbum[]>([]);
  const [loadingItems, setLoadingItems] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [removingTrack, setRemovingTrack] = useState<string | null>(null);
  const [removingAlbum, setRemovingAlbum] = useState<string | null>(null);

  useEffect(() => {
    fetchPlaylists();
  }, [fetchPlaylists]);

  const handleViewPlaylist = async (playlist: Playlist) => {
    setSelectedPlaylist(playlist);
    setLoadingItems(true);
    if (playlist.type === "albums") {
      const albums = await getPlaylistAlbums(playlist.id, true);
      setPlaylistAlbums(albums);
      setPlaylistTracks([]);
    } else {
      const tracks = await getPlaylistTracks(playlist.id, true);
      setPlaylistTracks(tracks);
      setPlaylistAlbums([]);
    }
    setLoadingItems(false);
  };

  const handleDeletePlaylist = async (playlistId: string) => {
    if (!confirm("Are you sure you want to delete this playlist?")) return;
    setDeleting(playlistId);
    await deletePlaylist(playlistId);
    setDeleting(null);
  };

  const handleRemoveTrack = async (playlistId: string, trackId: string) => {
    setRemovingTrack(trackId);
    await removeTrackFromPlaylist(playlistId, trackId);
    setPlaylistTracks((prev) => prev.filter((t) => t.track_id !== trackId));
    setRemovingTrack(null);
  };

  const handleRemoveAlbum = async (playlistId: string, albumId: string) => {
    setRemovingAlbum(albumId);
    await removeAlbumFromPlaylist(playlistId, albumId);
    setPlaylistAlbums((prev) => prev.filter((a) => a.album_id !== albumId));
    setRemovingAlbum(null);
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
            <button
              key={playlist.id}
              onClick={() => handleViewPlaylist(playlist)}
              className="group p-4 bg-neutral-900/30 border border-white/[0.04] hover:border-[#00f0ff]/20 hover:bg-neutral-900/50 transition-all duration-200 text-left rounded-sm"
            >
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 flex items-center justify-center bg-neutral-800 rounded-sm shrink-0 group-hover:bg-neutral-700 transition-colors">
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
            </button>
          ))}
        </div>
      )}

      {/* Playlist Detail Modal */}
      {selectedPlaylist && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedPlaylist(null)}
        >
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
          <div
            className="relative w-full max-w-lg max-h-[80vh] bg-[#0a0a0d] border border-white/[0.06] shadow-2xl flex flex-col rounded-lg"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06] shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-1 h-5 bg-[#00f0ff] rounded-full" />
                <div>
                  <h2 className="text-lg font-light tracking-tight text-white">
                    {selectedPlaylist.name}
                  </h2>
                  {selectedPlaylist.description && (
                    <p className="text-xs text-neutral-500">
                      {selectedPlaylist.description}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="xs"
                  variant="ghost"
                  onClick={() => handleDeletePlaylist(selectedPlaylist.id)}
                  disabled={deleting === selectedPlaylist.id}
                  className="text-red-400 hover:text-red-300"
                >
                  <FaTrash size={12} />
                </Button>
                <button
                  onClick={() => setSelectedPlaylist(null)}
                  className="text-neutral-500 hover:text-white transition-colors p-1 hover:bg-neutral-800 rounded"
                >
                  <FaTimes size={16} />
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="overflow-y-auto flex-1 p-4">
              {loadingItems ? (
                <div className="py-12 flex items-center justify-center">
                  <div className="w-6 h-6 border-2 border-[#00f0ff] border-t-transparent rounded-full animate-spin" />
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
                    <p className="text-neutral-700 text-xs mt-1">
                      Add albums from album pages
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
                          <div className="relative w-10 h-10 shrink-0 bg-neutral-800 overflow-hidden rounded-sm">
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
                            <p className="text-sm text-white truncate group-hover:text-[#00f0ff] transition-colors">
                              {album.album_name || "Unknown Album"}
                            </p>
                            <p className="text-xs text-neutral-500 truncate">
                              {album.artist_name || "Unknown Artist"}
                              {album.total_tracks &&
                                ` • ${album.total_tracks} tracks`}
                            </p>
                          </div>
                          <Button
                            size="xxs"
                            variant="ghost"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleRemoveAlbum(
                                selectedPlaylist.id,
                                album.album_id,
                              );
                            }}
                            disabled={removingAlbum === album.album_id}
                            className="opacity-0 group-hover:opacity-100 transition-opacity text-neutral-500 hover:text-red-400"
                          >
                            <FaTimes size={10} />
                          </Button>
                        </>
                      );

                      return href ? (
                        <Link
                          key={album.id}
                          href={href}
                          onClick={() => setSelectedPlaylist(null)}
                          className="group flex items-center gap-3 p-2 bg-neutral-900/30 border border-white/[0.04] hover:border-[#00f0ff]/20 hover:bg-neutral-900/50 rounded-sm transition-all duration-200"
                        >
                          {albumContent}
                        </Link>
                      ) : (
                        <div
                          key={album.id}
                          className="group flex items-center gap-3 p-2 bg-neutral-900/30 border border-white/[0.04] hover:border-white/[0.08] rounded-sm"
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
                  <p className="text-neutral-700 text-xs mt-1">
                    Add tracks from album pages
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
                        <div className="relative w-10 h-10 shrink-0 bg-neutral-800 overflow-hidden rounded-sm">
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
                          <p className="text-sm text-white truncate group-hover:text-[#00f0ff] transition-colors">
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
                        <Button
                          size="xxs"
                          variant="ghost"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleRemoveTrack(
                              selectedPlaylist.id,
                              track.track_id,
                            );
                          }}
                          disabled={removingTrack === track.track_id}
                          className="opacity-0 group-hover:opacity-100 transition-opacity text-neutral-500 hover:text-red-400"
                        >
                          <FaTimes size={10} />
                        </Button>
                      </>
                    );

                    return href ? (
                      <Link
                        key={track.id}
                        href={href}
                        onClick={() => setSelectedPlaylist(null)}
                        className="group flex items-center gap-3 p-2 bg-neutral-900/30 border border-white/[0.04] hover:border-[#00f0ff]/20 hover:bg-neutral-900/50 rounded-sm transition-all duration-200"
                      >
                        {trackContent}
                      </Link>
                    ) : (
                      <div
                        key={track.id}
                        className="group flex items-center gap-3 p-2 bg-neutral-900/30 border border-white/[0.04] hover:border-white/[0.08] rounded-sm"
                      >
                        {trackContent}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3 border-t border-white/[0.06] shrink-0">
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
