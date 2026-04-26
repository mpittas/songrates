"use client";

import { useState } from "react";
import {
  FaTimes,
  FaPlus,
  FaCheck,
  FaMusic,
  FaExclamationCircle,
} from "react-icons/fa";
import Link from "next/link";
import { Playlist } from "@/types/playlist";
import Button from "./Button";

interface BasePlaylistSelectorModalProps {
  title: string;
  onClose: () => void;
  loading: boolean;
  playlists: Playlist[];
  onCreatePlaylist: (name: string, description: string) => Promise<void>;
  onAddToPlaylist: (playlistId: string) => Promise<boolean | void>;
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
  const [feedback, setFeedback] = useState<Record<string, "success" | "error">>(
    {},
  );

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
    try {
      const result = await onAddToPlaylist(playlistId);
      const success = result !== false;
      setFeedback((prev) => ({
        ...prev,
        [playlistId]: success ? "success" : "error",
      }));
      if (success) {
        setTimeout(() => {
          setFeedback((prev) => {
            const next = { ...prev };
            delete next[playlistId];
            return next;
          });
        }, 3000);
      } else {
        setTimeout(() => {
          setFeedback((prev) => {
            const next = { ...prev };
            delete next[playlistId];
            return next;
          });
        }, 3000);
      }
    } catch {
      setFeedback((prev) => ({ ...prev, [playlistId]: "error" }));
      setTimeout(() => {
        setFeedback((prev) => {
          const next = { ...prev };
          delete next[playlistId];
          return next;
        });
      }, 3000);
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
        className="relative w-full max-w-md max-h-[80vh] bg-white border border-[#e1e1e1] shadow-2xl flex flex-col rounded-lg"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#ececec] shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-1 h-5 bg-[#1f1f1f] rounded-full" />
            <h2 className="text-lg font-light tracking-tight text-neutral-900">
              {title}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-neutral-500 hover:text-neutral-900 transition-colors p-1 hover:bg-neutral-200 rounded"
          >
            <FaTimes size={16} />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto flex-1 p-4">
          {loading ? (
            <div className="py-12 flex items-center justify-center">
              <div className="w-6 h-6 border-2 border-neutral-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <>
              {/* Create New Playlist Button */}
              {!creating ? (
                <button
                  onClick={() => setCreating(true)}
                  className="w-full flex items-center gap-3 p-3 mb-4 bg-[#f7f7f7] border border-dashed border-[#d6d6d6] hover:border-[#bdbdbd] hover:bg-[#efefef] transition-all duration-200 rounded-sm group"
                >
                  <div className="w-10 h-10 flex items-center justify-center bg-[#ececec] rounded-sm group-hover:bg-[#e0e0e0] transition-colors">
                    <FaPlus
                      size={16}
                      className="text-neutral-500 group-hover:text-neutral-900"
                    />
                  </div>
                  <span className="text-sm text-neutral-700 group-hover:text-neutral-900">
                    Create New Playlist
                  </span>
                </button>
              ) : (
                <div className="mb-4 p-4 bg-[#f7f7f7] border border-[#e1e1e1] rounded-sm">
                  <input
                    type="text"
                    placeholder="Playlist name"
                    value={newPlaylistName}
                    onChange={(e) => setNewPlaylistName(e.target.value)}
                    className="w-full bg-white border border-[#d8d8d8] rounded px-3 py-2 text-sm text-neutral-900 placeholder-neutral-500 focus:border-[#bcbcbc] focus:outline-none mb-2"
                    autoFocus
                  />
                  <input
                    type="text"
                    placeholder="Description (optional)"
                    value={newPlaylistDesc}
                    onChange={(e) => setNewPlaylistDesc(e.target.value)}
                    className="w-full bg-white border border-[#d8d8d8] rounded px-3 py-2 text-sm text-neutral-900 placeholder-neutral-500 focus:border-[#bcbcbc] focus:outline-none mb-3"
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
                    const itemFeedback = feedback[playlist.id];

                    return (
                      <div
                        key={playlist.id}
                        className={`
                          w-full flex items-center gap-3 p-3 rounded-sm transition-all duration-200
                          ${
                            isInPlaylist
                              ? "bg-[#f2f2f2] border border-[#cccccc]"
                              : itemFeedback === "error"
                                ? "bg-red-500/5 border border-red-500/20"
                                : "bg-white border border-[#e1e1e1] hover:border-[#cbcbcb] hover:bg-[#f8f8f8]"
                          }
                        `}
                      >
                        <button
                          onClick={() => handleAdd(playlist.id)}
                          disabled={isInPlaylist || isAdding}
                          className={`flex-1 flex items-center gap-3 min-w-0 ${isInPlaylist || isAdding ? "cursor-default" : "cursor-pointer"}`}
                        >
                          <div className="w-10 h-10 flex items-center justify-center bg-[#efefef] rounded-sm shrink-0">
                            {isInPlaylist ? (
                              <FaCheck size={14} className="text-neutral-900" />
                            ) : itemFeedback === "error" ? (
                              <FaExclamationCircle
                                size={14}
                                className="text-red-400"
                              />
                            ) : (
                              defaultIcon || (
                                <FaMusic
                                  size={14}
                                  className="text-neutral-500"
                                />
                              )
                            )}
                          </div>
                          <div className="flex-1 text-left min-w-0">
                            <h4 className="text-sm text-neutral-900 truncate">
                              {playlist.name}
                            </h4>
                            <p className="text-xs text-neutral-500">
                              {itemFeedback === "success"
                                ? "Added successfully!"
                                : itemFeedback === "error"
                                  ? "Failed to add. Try again."
                                  : getPlaylistSubtitle(playlist)}
                            </p>
                          </div>
                          {isAdding && (
                            <div className="w-4 h-4 border-2 border-[#00f0ff] border-t-transparent rounded-full animate-spin" />
                          )}
                          {itemFeedback === "success" && (
                            <FaCheck
                              size={12}
                              className="text-green-400 shrink-0"
                            />
                          )}
                        </button>
                        {isInPlaylist && (
                          <Link
                            href={`/playlist/${playlist.id}`}
                            onClick={onClose}
                            className="shrink-0 px-2 py-1 text-[10px] font-mono uppercase tracking-wider text-neutral-700 hover:text-neutral-900 hover:bg-neutral-200 rounded transition-colors"
                            title="Go to playlist"
                          >
                            Go to playlist
                          </Link>
                        )}
                      </div>
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
