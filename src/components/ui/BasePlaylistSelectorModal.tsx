"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
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
  HiMagnifyingGlass,
} from "react-icons/hi2";
import Link from "next/link";
import { Playlist } from "@/types/playlist";
import Button from "./Button";
import MainModal, { MainModalHeader } from "./MainModal";

interface BasePlaylistSelectorModalProps {
  title: string;
  onClose: () => void;
  loading: boolean;
  playlists: Playlist[];
  onCreatePlaylist: (name: string, description: string) => Promise<void>;
  onAddToPlaylist: (playlistId: string) => Promise<boolean | void>;
  /** Optional remove handler. If provided, already-added rows can remove via checkbox confirm. */
  onRemoveFromPlaylist?: (playlistId: string) => Promise<boolean | void>;
  /** Copy for the remove confirmation popover. */
  removeConfirmTitle?: string;
  isItemInPlaylist: (playlistId: string) => boolean;
  getPlaylistSubtitle: (playlist: Playlist) => string;
  defaultIcon?: React.ReactNode;
  /** Optional link shown in the footer (e.g. open current album / track context). */
  itemHref?: string;
}

export default function BasePlaylistSelectorModal({
  title,
  onClose,
  loading,
  playlists,
  onCreatePlaylist,
  onAddToPlaylist,
  onRemoveFromPlaylist,
  removeConfirmTitle = "Remove from playlist?",
  isItemInPlaylist,
  getPlaylistSubtitle,
  defaultIcon,
  itemHref,
}: BasePlaylistSelectorModalProps) {
  const MAX_PLAYLIST_NAME_CHARS = 40;
  const [creating, setCreating] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPlaylistIds, setSelectedPlaylistIds] = useState<Set<string>>(
    new Set(),
  );
  const [isSaving, setIsSaving] = useState(false);
  const [confirmRemovePlaylistId, setConfirmRemovePlaylistId] = useState<
    string | null
  >(null);
  const [removingPlaylistId, setRemovingPlaylistId] = useState<string | null>(
    null,
  );

  useEffect(() => {
    if (!confirmRemovePlaylistId) return;

    const handleClickOutside = () => {
      setConfirmRemovePlaylistId(null);
    };

    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [confirmRemovePlaylistId]);

  const truncateToChars = (text: string, maxChars: number) => {
    const s = (text || "").trim();
    if (s.length <= maxChars) return s;
    return `${s.slice(0, Math.max(0, maxChars - 1))}…`;
  };

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
    const name = newPlaylistName.trim();
    if (!name) return;
    if (name.length > MAX_PLAYLIST_NAME_CHARS) {
      toast.error("Playlist name is too long", {
        description: `Max ${MAX_PLAYLIST_NAME_CHARS} characters.`,
      });
      return;
    }
    await onCreatePlaylist(name, "");
    setCreating(false);
    setNewPlaylistName("");
  };

  const toggleSelection = (playlistId: string) => {
    setSelectedPlaylistIds((prev) => {
      // This modal only adds items (no remove). If it's already in the playlist,
      // don't allow toggling at all.
      if (isItemInPlaylist(playlistId)) return prev;

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

      if (playlistsToAdd.length === 0) {
        onClose();
        return;
      }

      const results = await Promise.all(
        playlistsToAdd.map((id) => onAddToPlaylist(id)),
      );

      if (results.some(Boolean)) {
        onClose();
      }
    } catch (error) {
      console.error("Error saving to playlists:", error);
      toast.error("Couldn't save playlist changes", {
        description: "Please try again in a moment.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleConfirmRemove = async (playlistId: string) => {
    if (!onRemoveFromPlaylist) return;
    setRemovingPlaylistId(playlistId);
    try {
      const res = await onRemoveFromPlaylist(playlistId);
      if (!res) {
        toast.error("Couldn't remove from playlist", {
          description: "Please try again.",
        });
      }
    } catch (e) {
      console.error("Error removing from playlist:", e);
      toast.error("Couldn't remove from playlist", {
        description: "Please try again.",
      });
    } finally {
      setRemovingPlaylistId(null);
      setConfirmRemovePlaylistId(null);
    }
  };

  return (
    <MainModal onClose={onClose} maxWidthClassName="max-w-md">
      <MainModalHeader title={title} onClose={onClose}>
        {/* Search Bar - Spotify Style */}
        {/* <div className="relative group">
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
        </div> */}
      </MainModalHeader>

        {/* Content Section */}
        <div className="flex-1 overflow-y-auto p-5 scrollbar-none bg-blue-500/0">
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
                    className="w-full group flex items-center gap-4 p-2 bg-neutral-900 rounded-2xl transition-all duration-300 hover:border-neutral-100"
                  >
                    <div className="w-14 h-14 flex items-center justify-center bg-neutral-100 rounded-xl group-hover:bg-neutral-200 transition-colors">
                      <HiPlus size={20} className="text-neutral-900" />
                    </div>
                    <div className="text-left">
                      <p className="text-md font-medium text-white">
                        Create new playlist
                      </p>
                    </div>
                  </button>
                ) : (
                  <div className="p-5 bg-neutral-900 rounded-2xl space-y-3 animate-in slide-in-from-top-4 duration-300">
                    <div className="space-y-4">
                      <div className="space-y-1">
                        <label className="text-sm text-white/70 pb-0.5 block">
                          Playlist Name
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. Late Night Vibes"
                          value={newPlaylistName}
                          onChange={(e) => setNewPlaylistName(e.target.value)}
                          maxLength={MAX_PLAYLIST_NAME_CHARS}
                          className="w-full bg-white/20 text-white rounded-xl p-3 focus:ring-1 focus:ring-neutral-100/60 focus:border-neutral-900 outline-none placeholder:text-neutral-300 transition-all"
                          autoFocus
                        />
                      </div>
                    </div>
                    <div className="flex gap-2 pt-2">
                      <Button
                        onClick={handleCreate}
                        disabled={!newPlaylistName.trim()}
                        variant="white"
                        size="md"
                        className="flex-1"
                      >
                        Create & Add
                      </Button>
                      <Button
                        onClick={() => setCreating(false)}
                        variant="whiteMuted"
                        size="md"
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
                    <div className="w-16 h-16 bg-neutral-50 rounded-full flex items-center justify-center mb-4">
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
                      const isAlreadyInPlaylist = isItemInPlaylist(playlist.id);
                      const showRemove =
                        Boolean(onRemoveFromPlaylist) && isAlreadyInPlaylist;

                      return (
                        <div
                          key={playlist.id}
                          role="button"
                          tabIndex={0}
                          onClick={() => {
                            if (isAlreadyInPlaylist) return;
                            toggleSelection(playlist.id);
                          }}
                          onKeyDown={(e) => {
                            if (e.key !== "Enter" && e.key !== " ") return;
                            e.preventDefault();
                            if (isAlreadyInPlaylist) return;
                            toggleSelection(playlist.id);
                          }}
                          className={`relative w-full flex items-center gap-4 p-2 rounded-2xl transition-all duration-200
                            ${
                              isAlreadyInPlaylist
                                ? "bg-neutral-100"
                                : isSelected
                                  ? "bg-green-500/20"
                                  : "bg-neutral-200"
                            }
                          `}
                        >
                          <div
                            className={`w-14 h-14 flex items-center justify-center rounded-xl transition-colors shrink-0
                            ${
                              isAlreadyInPlaylist
                                ? "bg-neutral-200"
                                : isSelected
                                  ? "bg-green-500/30"
                                  : "bg-white"
                            }
                          `}
                          >
                            <div
                              className={
                                isAlreadyInPlaylist
                                  ? "[&_svg]:text-neutral-600 transition-colors"
                                  : isSelected
                                    ? "[&_svg]:text-green-800 transition-colors"
                                    : "[&_svg]:text-neutral-800 transition-colors"
                              }
                            >
                              {defaultIcon || <FaMusic size={18} />}
                            </div>
                          </div>

                          <div className="flex-1 text-left min-w-0">
                            <Link
                              href={`/playlist/${playlist.id}`}
                              target="_blank"
                              rel="noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className={` text-md font-medium truncate transition-colors hover:underline ${
                                isSelected ? "text-green-950" : "text-neutral-950"
                              }`}
                              aria-label={`Open playlist ${playlist.name} in new tab`}
                            >
                              {truncateToChars(playlist.name, 26)}
                            </Link>
                            {isAlreadyInPlaylist ? (
                              <div className="absolute top-1/2 -translate-y-1/2 right-10 -mt-0.5">
                                <span className="inline-flex items-center rounded-full bg-neutral-300 px-1.5 text-[11px] font-semibold tracking-wide text-neutral-800">
                                  Added
                                </span>
                              </div>
                            ) : null}
                          </div>

                          {/* Selection Checkbox/Radio */}
                          <div
                            className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all
                            ${
                              isAlreadyInPlaylist
                                ? "bg-neutral-900 border-neutral-900 text-white"
                                : isSelected
                                  ? "bg-green-500 border-green-500 text-white scale-110 shadow-sm"
                                  : "border-neutral-400"
                            }
                          `}
                            role={showRemove ? "button" : undefined}
                            tabIndex={showRemove ? 0 : undefined}
                            onClick={(e) => {
                              if (!showRemove) return;
                              e.preventDefault();
                              e.stopPropagation();
                              setConfirmRemovePlaylistId(playlist.id);
                            }}
                          >
                            {(isAlreadyInPlaylist || isSelected) && (
                              <FaCheck size={10} />
                            )}
                          </div>

                          {showRemove && confirmRemovePlaylistId === playlist.id ? (
                            <div
                              className="absolute right-12 top-1/2 z-50 -translate-y-1/2"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <div className="relative w-[220px] rounded-xl bg-neutral-800 p-3 text-white shadow-xl text-center">
                                <div className="absolute left-full top-1/2 -translate-y-1/2 border-8 border-transparent border-l-neutral-800" />
                                <div className="text-sm pb-2">
                                  {removeConfirmTitle}
                                </div>
                                <div className="mt-2 flex items-center justify-end gap-2">
                                  <button
                                    type="button"
                                    className="shrink-0 rounded-lg bg-neutral-900 px-2.5 py-1.5 text-xs font-semibold text-neutral-200 hover:bg-neutral-950"
                                    onClick={() =>
                                      setConfirmRemovePlaylistId(null)
                                    }
                                  >
                                    Cancel
                                  </button>
                                  <button
                                    type="button"
                                    disabled={removingPlaylistId === playlist.id}
                                    className="flex-1 rounded-lg bg-white px-2.5 py-1.5 text-xs font-semibold text-neutral-950 hover:bg-neutral-200 disabled:opacity-60"
                                    onClick={() =>
                                      handleConfirmRemove(playlist.id)
                                    }
                                  >
                                    {removingPlaylistId === playlist.id
                                      ? "Removing…"
                                      : "Yes, remove"}
                                  </button>
                                </div>
                              </div>
                            </div>
                          ) : null}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-neutral-100 bg-white p-5">
          <div className="flex items-center gap-3">
            <Button onClick={onClose} variant="ghost">
              Cancel
            </Button>
          </div>
          <Button onClick={handleDone} disabled={isSaving} variant="primary">
            {isSaving ? "Saving..." : "Done"}
          </Button>
        </div>
    </MainModal>
  );
}
