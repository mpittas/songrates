"use client";

import { useEffect, useState } from "react";
import { FaCompactDisc } from "react-icons/fa";
import { usePlaylist } from "@/context/PlaylistContext";
import BasePlaylistSelectorModal from "./BasePlaylistSelectorModal";
import { Playlist } from "@/types/playlist";

interface AlbumPlaylistSelectorModalProps {
  albumId: string;
  albumName?: string;
  artistName?: string;
  thumbnailUrl?: string;
  releaseDate?: string;
  totalTracks?: number;
  onClose: () => void;
}

export default function AlbumPlaylistSelectorModal({
  albumId,
  albumName,
  artistName,
  thumbnailUrl,
  releaseDate,
  totalTracks,
  onClose,
}: AlbumPlaylistSelectorModalProps) {
  const {
    playlists,
    loading,
    fetchPlaylists,
    createPlaylist,
    addAlbumToPlaylist,
    getPlaylistAlbums,
  } = usePlaylist();

  const [playlistAlbumCounts, setPlaylistAlbumCounts] = useState<
    Record<string, number>
  >({});
  const [albumInPlaylist, setAlbumInPlaylist] = useState<
    Record<string, boolean>
  >({});

  // Only show album-type playlists
  const albumPlaylists = playlists.filter((p) => p.type === "albums");

  useEffect(() => {
    fetchPlaylists();
  }, [fetchPlaylists]);

  // Check album membership in each album playlist
  useEffect(() => {
    const checkAlbums = async () => {
      const counts: Record<string, number> = {};
      const memberships: Record<string, boolean> = {};

      for (const playlist of albumPlaylists) {
        const albums = await getPlaylistAlbums(playlist.id);
        counts[playlist.id] = albums.length;
        memberships[playlist.id] = albums.some((a) => a.album_id === albumId);
      }

      setPlaylistAlbumCounts(counts);
      setAlbumInPlaylist(memberships);
    };

    if (albumPlaylists.length > 0) {
      checkAlbums();
    }
  }, [playlists, albumId, getPlaylistAlbums]);

  const handleCreatePlaylist = async (name: string, description: string) => {
    const playlist = await createPlaylist({
      name,
      description: description || undefined,
      type: "albums",
    });

    if (playlist) {
      await addAlbumToPlaylist({
        playlistId: playlist.id,
        albumId,
        albumName,
        artistName,
        thumbnailUrl,
        releaseDate,
        totalTracks,
      });
      onClose();
    }
  };

  const handleAddToPlaylist = async (playlistId: string) => {
    const success = await addAlbumToPlaylist({
      playlistId,
      albumId,
      albumName,
      artistName,
      thumbnailUrl,
      releaseDate,
      totalTracks,
    });

    if (success) {
      setAlbumInPlaylist((prev) => ({ ...prev, [playlistId]: true }));
      setPlaylistAlbumCounts((prev) => ({
        ...prev,
        [playlistId]: (prev[playlistId] || 0) + 1,
      }));
    }
  };

  return (
    <BasePlaylistSelectorModal
      title="Add Album to Playlist"
      onClose={onClose}
      loading={loading}
      playlists={albumPlaylists}
      onCreatePlaylist={handleCreatePlaylist}
      onAddToPlaylist={handleAddToPlaylist}
      isItemInPlaylist={(id) => albumInPlaylist[id] || false}
      getPlaylistSubtitle={(p) => `${playlistAlbumCounts[p.id] || 0} albums`}
      defaultIcon={<FaCompactDisc size={14} className="text-neutral-500" />}
    />
  );
}
