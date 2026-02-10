"use client";

import { useState } from "react";
import {
  FaTimes,
  FaPlus,
  FaCheck,
  FaCompactDisc,
  FaMusic,
} from "react-icons/fa";
import { Playlist } from "@/types/playlist";
import Button from "./Button";

interface BasePlaylistSelectorModalProps {
  title: string;
  onClose: () => void;
  loading: boolean;
  playlists: Playlist[];
  onCreatePlaylist: (name: string, description: string) => Promise<void>;
  onAddToPlaylist: (playlistId: string) => Promise<void>;
  isItemInPlaylist: (playlistId: string) => boolean;
  getPlaylistSubtitle: (playlist: Playlist) => string;
  defaultIcon?: React.ReactNode;
}

export default function BasePlaylistSelectorModal({
  title,
  onClose,
  loading,
  playlists,
  onCreatePlaylist,
  onAddToPlaylist,
  isItemInPlaylist,
  getPlaylistSubtitle,
  defaultIcon,
}: BasePlaylistSelectorModalProps) {
  const [creating, setCreating] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState("");
  const [newPlaylistDesc, setNewPlaylistDesc] = useState("");
  const [addingTo, setAddingTo] = useState<string | null>(null);

  const handleCreate = async () => {
    if (!newPlaylistName.trim()) return;
    await onCreatePlaylist(newPlaylistName.trim(), newPlaylistDesc.trim());
    setCreating(false);
    setNewPlaylistName("");
    setNewPlaylistDesc("");
  };

  const handleAdd = async (playlistId: string) => {
    if (isItemInPlaylist(playlistId)) return;
    setAddingTo(playlistId);
    await onAddToPlaylist(playlistId);
    setAddingTo(null);
  };

  const Icon = defaultIcon || (
    <FaMusic size={14} className="text-neutral-500" />
  );

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
              {title}
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
                      onClick={handleCreate}
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
                  {/* Default fallback icon if list is empty */}
                  <FaMusic
                    size={24}
                    className="text-neutral-700 mx-auto mb-3"
                  />
                  <p className="text-neutral-600 font-mono text-sm">
                    No playlists available
                  </p>
                  <p className="text-neutral-700 text-xs mt-1">
                    Create your first playlist above
                  </p>
                </div>
              ) : (
                <div className="space-y-1">
                  {playlists.map((playlist) => {
                    const isInPlaylist = isItemInPlaylist(playlist.id);
                    const isAdding = addingTo === playlist.id;

                    return (
                      <button
                        key={playlist.id}
                        onClick={() => handleAdd(playlist.id)}
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
                            // Render the passed icon or fallback
                            defaultIcon || (
                              <FaMusic size={14} className="text-neutral-500" />
                            )
                          )}
                        </div>
                        <div className="flex-1 text-left min-w-0">
                          <h4 className="text-sm text-white truncate">
                            {playlist.name}
                          </h4>
                          <p className="text-xs text-neutral-500">
                            {getPlaylistSubtitle(playlist)}
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
