"use client";

import { useCallback, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { usePlaylist } from "@/context/PlaylistContext";
import { createClient } from "@/utils/supabase/client";
import type { CollectionCardData } from "@/components/profile/AlbumCollectionsSection";

export function usePlaylistCollectionActions(
  userId: string,
  setCollections: React.Dispatch<React.SetStateAction<CollectionCardData[]>>,
) {
  const { user } = useAuth();
  const { deletePlaylist } = usePlaylist();
  const isOwner = user?.id === userId;

  const [editingPlaylistId, setEditingPlaylistId] = useState<string | null>(
    null,
  );
  const [editName, setEditName] = useState("");
  const [savingEdits, setSavingEdits] = useState(false);

  const handleDeletePlaylist = useCallback(
    async (playlistId: string, playlistName: string) => {
      if (
        !confirm(
          `Are you sure you want to delete "${playlistName}"? This cannot be undone.`,
        )
      ) {
        return;
      }
      await deletePlaylist(playlistId);
      setCollections((prev) => prev.filter((c) => c.id !== playlistId));
    },
    [deletePlaylist, setCollections],
  );

  const openEditPlaylist = useCallback(
    (playlistId: string, playlistName: string) => {
      setEditingPlaylistId(playlistId);
      setEditName(playlistName);
    },
    [],
  );

  const closeEditPlaylist = useCallback(() => {
    setEditingPlaylistId(null);
    setEditName("");
  }, []);

  const handleSavePlaylistEdits = useCallback(async () => {
    if (!user || !editingPlaylistId) return;
    const nextName = editName.trim();
    if (!nextName) return;

    setSavingEdits(true);
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("playlists")
        .update({
          name: nextName,
          updated_at: new Date().toISOString(),
        })
        .eq("id", editingPlaylistId)
        .eq("user_id", user.id)
        .select("id, name")
        .single();

      if (!error && data) {
        setCollections((prev) =>
          prev.map((c) =>
            c.id === editingPlaylistId ? { ...c, name: data.name } : c,
          ),
        );
        closeEditPlaylist();
      }
    } finally {
      setSavingEdits(false);
    }
  }, [
    user,
    editingPlaylistId,
    editName,
    setCollections,
    closeEditPlaylist,
  ]);

  return {
    isOwner,
    handleDeletePlaylist,
    openEditPlaylist,
    editingPlaylistId,
    editName,
    setEditName,
    savingEdits,
    closeEditPlaylist,
    handleSavePlaylistEdits,
  };
}
