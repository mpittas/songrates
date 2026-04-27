"use client";

import { useState } from "react";
import {
  FaTimes,
  FaPlus,
  FaCheck,
  FaMusic,
  FaExclamationCircle,
  FaSearch,
} from "react-icons/fa";
import {
  HiPlus,
  HiCheck,
  HiOutlinePlusCircle,
  HiArrowRight,
  HiMagnifyingGlass,
} from "react-icons/hi2";
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
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPlaylistIds, setSelectedPlaylistIds] = useState<Set<string>>(
    new Set(),
  );
  const [isSaving, setIsSaving] = useState(false);

  // Initialize selected IDs based on what's already in playlists
  useState(() => {
    const initial = new Set<string>();
    playlists.forEach((p) => {
      if (isItemInPlaylist(p.id)) initial.add(p.id);
    });
    setSelectedPlaylistIds(initial);
  });

  const filteredPlaylists = playlists.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const handleCreate = async () => {
    if (!newPlaylistName.trim()) return;
    await onCreatePlaylist(newPlaylistName.trim(), "");
    setCreating(false);
    setNewPlaylistName("");
  };

  const toggleSelection = (playlistId: string) => {
    // If it was already in the playlist initially, we might want to prevent unselecting
    // depending on requirements, but Spotify allows toggling.
    setSelectedPlaylistIds((prev) => {
      const next = new Set(prev);
      if (next.has(playlistId)) {
        next.delete(playlistId);
      } else {
        next.add(playlistId);
      }
      return next;
    });
  };

  const handleDone = async () => {
    setIsSaving(true);
    try {
      // Find playlists that were selected but aren't currently marked as "in playlist"
      const playlistsToAdd = Array.from(selectedPlaylistIds).filter(
        (id) => !isItemInPlaylist(id),
      );

      // Perform all additions
      await Promise.all(playlistsToAdd.map((id) => onAddToPlaylist(id)));

      onClose();
    } catch (error) {
      console.error("Error saving to playlists:", error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-neutral-950/40 backdrop-blur-md" />

      <div
        className="relative w-full max-w-sm max-h-[85vh] bg-white border border-neutral-200 shadow-2xl flex flex-col rounded-3xl overflow-hidden scale-in-center animate-in zoom-in-95 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 flex flex-col gap-4 bg-white border-b border-neutral-200">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <h2 className="text-xl font-bold tracking-tight text-neutral-900 leading-tight">
                {title}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-full bg-neutral-50 text-neutral-400 hover:text-neutral-900 hover:bg-neutral-100 transition-all border border-neutral-100"
            >
              <FaTimes size={14} />
            </button>
          </div>

          {/* Search Bar - Spotify Style */}
          <div className="relative group">
            <HiMagnifyingGlass
              className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 group-focus-within:text-neutral-900 transition-colors"
              size={18}
            />
            <input
              type="text"
              placeholder="Find a playlist"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-neutral-100 border border-neutral-200 rounded-xl py-2.5 pl-10 pr-4 text-sm font-medium focus:ring-2 focus:ring-neutral-900/5 outline-none transition-all placeholder:text-neutral-400"
            />
          </div>
        </div>

        {/* Content Section */}
        <div className="flex-1 overflow-y-auto p-6 scrollbar-none bg-blue-500/0">
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center gap-3">
              <div className="w-8 h-8 border-3 border-neutral-200 border-t-neutral-900 rounded-full animate-spin" />
              <span className="text-xs font-bold text-neutral-400 uppercase tracking-widest font-mono">
                Loading
              </span>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Add New Section */}
              <div>
                {!creating ? (
                  <button
                    onClick={() => setCreating(true)}
                    className="w-full group flex items-center gap-4 p-4 bg-neutral-900 rounded-2xl transition-all duration-300 hover:border-neutral-100"
                  >
                    <div className="w-10 h-10 flex items-center justify-center bg-neutral-100 rounded-xl group-hover:bg-neutral-200 transition-colors">
                      <HiPlus size={20} className="text-neutral-900" />
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-bold text-white">
                        Create new playlist
                      </p>
                    </div>
                  </button>
                ) : (
                  <div className="p-5 bg-neutral-900 rounded-2xl space-y-3 animate-in slide-in-from-top-4 duration-300">
                    <div className="space-y-4">
                      <div className="space-y-1">
                        <label className="text-sm text-white pb-0.5 block">
                          Playlist Name
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. Late Night Vibes"
                          value={newPlaylistName}
                          onChange={(e) => setNewPlaylistName(e.target.value)}
                          className="w-full bg-white rounded-xl px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-neutral-900/5 focus:border-neutral-900 outline-none transition-all"
                          autoFocus
                        />
                      </div>
                    </div>
                    <div className="flex gap-2 pt-2">
                      <Button
                        onClick={handleCreate}
                        disabled={!newPlaylistName.trim()}
                        variant="secondary"
                        size="sm"
                        className="flex-1"
                      >
                        Create & Add
                      </Button>
                      <Button
                        onClick={() => setCreating(false)}
                        variant="ghost"
                        size="sm"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              {/* Section Divider */}
              <div className="h-px w-full bg-neutral-100" />

              {/* Playlist List */}
              <div className="space-y-3">
                {filteredPlaylists.length === 0 && !creating ? (
                  <div className="py-12 flex flex-col items-center justify-center text-center px-4">
                    <div className="w-12 h-12 bg-neutral-50 rounded-full flex items-center justify-center mb-4">
                      <FaMusic className="text-neutral-200" size={20} />
                    </div>
                    <p className="text-sm font-bold text-neutral-900 mb-1">
                      No playlists found
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-2">
                    {filteredPlaylists.map((playlist) => {
                      const isSelected = selectedPlaylistIds.has(playlist.id);

                      return (
                        <button
                          key={playlist.id}
                          onClick={() => toggleSelection(playlist.id)}
                          className={`w-full flex items-center gap-4 p-3 rounded-2xl transition-all duration-200 border
                            ${
                              isSelected
                                ? "bg-neutral-100 border-neutral-300 hover:bg-neutral-200"
                                : "bg-neutral-100 border-neutral-200 hover:bg-neutral-200"
                            }
                          `}
                        >
                          <div
                            className={`w-12 h-12 flex items-center justify-center rounded-xl transition-colors shrink-0 border border-neutral-200
                            ${isSelected ? "bg-white" : "bg-white"}
                          `}
                          >
                            <div
                              className={`transition-colors ${isSelected ? "text-white" : "text-neutral-400"}`}
                            >
                              {defaultIcon || <FaMusic size={16} />}
                            </div>
                          </div>

                          <div className="flex-1 text-left min-w-0">
                            <h4
                              className={`text-sm font-bold truncate transition-colors ${isSelected ? "text-neutral-900" : "text-neutral-900"}`}
                            >
                              {playlist.name}
                            </h4>
                          </div>

                          {/* Selection Checkbox/Radio */}
                          <div
                            className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all
                            ${
                              isSelected
                                ? "bg-green-500 border-green-500 text-white scale-110 shadow-sm"
                                : "border-neutral-300"
                            }
                          `}
                          >
                            {isSelected && <FaCheck size={10} />}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 bg-white border-t border-neutral-100 flex items-center justify-between">
          <Button onClick={onClose} variant="ghost">
            Cancel
          </Button>
          <Button onClick={handleDone} disabled={isSaving} variant="primary">
            {isSaving ? "Saving..." : "Done"}
          </Button>
        </div>
      </div>
    </div>
  );
}
