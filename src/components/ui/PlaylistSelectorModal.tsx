"use client";

import { useState, useEffect } from "react";
import { FaTimes, FaPlus, FaCheck, FaMusic, FaTrash } from "react-icons/fa";
import { usePlaylist } from "@/context/PlaylistContext";
import Button from "./Button";

interface PlaylistSelectorModalProps {
  trackId: string;
  trackName?: string;
  artistName?: string;
  albumName?: string;
  albumId?: string;
  thumbnailUrl?: string;
  durationMs?: number;
  onClose: () => void;
}

export default function PlaylistSelectorModal({
  trackId,
  trackName,
  artistName,
  albumName,
  albumId,
  thumbnailUrl,
  durationMs,
  onClose,
}: PlaylistSelectorModalProps) {
  const {
    playlists,
    loading,
    fetchPlaylists,
    createPlaylist,
    addTrackToPlaylist,
    getPlaylistTracks,
  } = usePlaylist();
  const [creating, setCreating] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState("");
  const [newPlaylistDesc, setNewPlaylistDesc] = useState("");
  const [addingTo, setAddingTo] = useState<string | null>(null);
  const [playlistTrackCounts, setPlaylistTrackCounts] = useState<
    Record<string, number>
  >({});
  const [trackInPlaylist, setTrackInPlaylist] = useState<
    Record<string, boolean>
  >({});

  // Load playlists and check which ones contain this track
  useEffect(() => {
    fetchPlaylists();
  }, [fetchPlaylists]);

  // Check track membership in each playlist
  useEffect(() => {
    const checkTracks = async () => {
      const counts: Record<string, number> = {};
      const memberships: Record<string, boolean> = {};

      for (const playlist of playlists) {
        const tracks = await getPlaylistTracks(playlist.id);
        counts[playlist.id] = tracks.length;
        memberships[playlist.id] = tracks.some((t) => t.track_id === trackId);
      }

      setPlaylistTrackCounts(counts);
      setTrackInPlaylist(memberships);
    };

    if (playlists.length > 0) {
      checkTracks();
    }
  }, [playlists, trackId, getPlaylistTracks]);

  const handleCreatePlaylist = async () => {
    if (!newPlaylistName.trim()) return;

    const playlist = await createPlaylist({
      name: newPlaylistName.trim(),
      description: newPlaylistDesc.trim() || undefined,
    });

    if (playlist) {
      // Auto-add the track to the new playlist
      await addTrackToPlaylist({
        playlistId: playlist.id,
        trackId,
        trackName,
        artistName,
        albumName,
        albumId,
        thumbnailUrl,
        durationMs,
      });
      setCreating(false);
      setNewPlaylistName("");
      setNewPlaylistDesc("");
      onClose();
    }
  };

  const handleAddToPlaylist = async (playlistId: string) => {
    if (trackInPlaylist[playlistId]) return;

    setAddingTo(playlistId);
    const success = await addTrackToPlaylist({
      playlistId,
      trackId,
      trackName,
      artistName,
      albumName,
      albumId,
      thumbnailUrl,
      durationMs,
    });

    if (success) {
      setTrackInPlaylist((prev) => ({ ...prev, [playlistId]: true }));
      setPlaylistTrackCounts((prev) => ({
        ...prev,
        [playlistId]: (prev[playlistId] || 0) + 1,
      }));
    }
    setAddingTo(null);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-md max-h-[80vh] bg-[#0a0a0d] border border-white/[0.06] shadow-2xl flex flex-col rounded-lg"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06] shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-1 h-5 bg-[#00f0ff] rounded-full" />
            <h2 className="text-lg font-light tracking-tight text-white">
              Add to Playlist
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-neutral-500 hover:text-white transition-colors p-1 hover:bg-neutral-800 rounded"
          >
            <FaTimes size={16} />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto flex-1 p-4">
          {loading ? (
            <div className="py-12 flex items-center justify-center">
              <div className="w-6 h-6 border-2 border-[#00f0ff] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <>
              {/* Create New Playlist Button */}
              {!creating ? (
                <button
                  onClick={() => setCreating(true)}
                  className="w-full flex items-center gap-3 p-3 mb-4 bg-neutral-900/50 border border-dashed border-white/[0.1] hover:border-[#00f0ff]/30 hover:bg-neutral-900/80 transition-all duration-200 rounded-sm group"
                >
                  <div className="w-10 h-10 flex items-center justify-center bg-neutral-800 rounded-sm group-hover:bg-[#00f0ff]/10 transition-colors">
                    <FaPlus
                      size={16}
                      className="text-neutral-400 group-hover:text-[#00f0ff]"
                    />
                  </div>
                  <span className="text-sm text-neutral-300 group-hover:text-white">
                    Create New Playlist
                  </span>
                </button>
              ) : (
                <div className="mb-4 p-4 bg-neutral-900/50 border border-white/[0.06] rounded-sm">
                  <input
                    type="text"
                    placeholder="Playlist name"
                    value={newPlaylistName}
                    onChange={(e) => setNewPlaylistName(e.target.value)}
                    className="w-full bg-neutral-800 border border-white/[0.06] rounded px-3 py-2 text-sm text-white placeholder-neutral-600 focus:border-[#00f0ff]/30 focus:outline-none mb-2"
                    autoFocus
                  />
                  <input
                    type="text"
                    placeholder="Description (optional)"
                    value={newPlaylistDesc}
                    onChange={(e) => setNewPlaylistDesc(e.target.value)}
                    className="w-full bg-neutral-800 border border-white/[0.06] rounded px-3 py-2 text-sm text-white placeholder-neutral-600 focus:border-[#00f0ff]/30 focus:outline-none mb-3"
                  />
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="primary"
                      onClick={handleCreatePlaylist}
                      disabled={!newPlaylistName.trim()}
                    >
                      Create & Add
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setCreating(false);
                        setNewPlaylistName("");
                        setNewPlaylistDesc("");
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}

              {/* Existing Playlists */}
              {playlists.length === 0 && !creating ? (
                <div className="py-8 text-center">
                  <FaMusic
                    size={24}
                    className="text-neutral-700 mx-auto mb-3"
                  />
                  <p className="text-neutral-600 font-mono text-sm">
                    No playlists yet
                  </p>
                  <p className="text-neutral-700 text-xs mt-1">
                    Create your first playlist above
                  </p>
                </div>
              ) : (
                <div className="space-y-1">
                  {playlists.map((playlist) => {
                    const isInPlaylist = trackInPlaylist[playlist.id];
                    const isAdding = addingTo === playlist.id;

                    return (
                      <button
                        key={playlist.id}
                        onClick={() => handleAddToPlaylist(playlist.id)}
                        disabled={isInPlaylist || isAdding}
                        className={`
                          w-full flex items-center gap-3 p-3 rounded-sm transition-all duration-200
                          ${
                            isInPlaylist
                              ? "bg-[#00f0ff]/5 border border-[#00f0ff]/20"
                              : "bg-neutral-900/30 border border-white/[0.04] hover:border-[#00f0ff]/20 hover:bg-neutral-900/50"
                          }
                          ${isInPlaylist || isAdding ? "cursor-default" : "cursor-pointer"}
                        `}
                      >
                        <div className="w-10 h-10 flex items-center justify-center bg-neutral-800 rounded-sm shrink-0">
                          {isInPlaylist ? (
                            <FaCheck size={14} className="text-[#00f0ff]" />
                          ) : (
                            <FaMusic size={14} className="text-neutral-500" />
                          )}
                        </div>
                        <div className="flex-1 text-left min-w-0">
                          <h4 className="text-sm text-white truncate">
                            {playlist.name}
                          </h4>
                          <p className="text-xs text-neutral-500">
                            {playlistTrackCounts[playlist.id] || 0} tracks
                          </p>
                        </div>
                        {isAdding && (
                          <div className="w-4 h-4 border-2 border-[#00f0ff] border-t-transparent rounded-full animate-spin" />
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
