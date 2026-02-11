"use client";

import { useEffect, useState } from "react";
import { FaMusic } from "react-icons/fa";
import { usePlaylist } from "@/context/PlaylistContext";
import BasePlaylistSelectorModal from "./BasePlaylistSelectorModal";
import { createSlug } from "@/lib/utils";

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

  const [playlistTrackCounts, setPlaylistTrackCounts] = useState<
    Record<string, number>
  >({});
  const [trackInPlaylist, setTrackInPlaylist] = useState<
    Record<string, boolean>
  >({});

  // Only show songs-type playlists
  const songPlaylists = playlists.filter((p) => p.type === "songs");

  // Load playlists and check which ones contain this track
  useEffect(() => {
    fetchPlaylists();
  }, [fetchPlaylists]);

  // Check track membership in each song playlist
  useEffect(() => {
    const checkTracks = async () => {
      const counts: Record<string, number> = {};
      const memberships: Record<string, boolean> = {};

      for (const playlist of songPlaylists) {
        const tracks = await getPlaylistTracks(playlist.id);
        counts[playlist.id] = tracks.length;
        memberships[playlist.id] = tracks.some((t) => t.track_id === trackId);
      }

      setPlaylistTrackCounts(counts);
      setTrackInPlaylist(memberships);
    };

    if (songPlaylists.length > 0) {
      checkTracks();
    }
  }, [playlists, trackId, getPlaylistTracks]);

  const handleCreatePlaylist = async (name: string, description: string) => {
    const playlist = await createPlaylist({
      name,
      description: description || undefined,
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
      onClose();
    }
  };

  const handleAddToPlaylist = async (playlistId: string) => {
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

    return success;
  };

  return (
    <BasePlaylistSelectorModal
      title="Add Song to Playlist"
      onClose={onClose}
      loading={loading}
      playlists={songPlaylists}
      onCreatePlaylist={handleCreatePlaylist}
      onAddToPlaylist={handleAddToPlaylist}
      isItemInPlaylist={(id) => trackInPlaylist[id] || false}
      getPlaylistSubtitle={(p) => `${playlistTrackCounts[p.id] || 0} tracks`}
      defaultIcon={<FaMusic size={14} className="text-neutral-500" />}
      itemHref={
        albumId && albumName
          ? `/album/${createSlug(albumName, albumId)}?track=${trackId}`
          : undefined
      }
    />
  );
}
