"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { FaMusic } from "react-icons/fa";
import { usePlaylist } from "@/context/PlaylistContext";
import BasePlaylistSelectorModal from "./BasePlaylistSelectorModal";
import ToastContent from "./ToastContent";
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
  const router = useRouter();
  const {
    playlists,
    loading,
    fetchPlaylists,
    createPlaylist,
    addTrackToPlaylist,
    removeTrackFromPlaylist,
    getPlaylistTracks,
  } = usePlaylist();

  const [playlistTrackCounts, setPlaylistTrackCounts] = useState<
    Record<string, number>
  >({});
  const [trackInPlaylist, setTrackInPlaylist] = useState<
    Record<string, boolean>
  >({});

  const songPlaylists = playlists.filter((p) => p.type === "songs");

  useEffect(() => {
    fetchPlaylists();
  }, [fetchPlaylists]);

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

  const openPlaylistToast = (playlistId: string, playlistName: string) => {
    const titleLine = trackName?.trim() || "Song";
    const description = artistName?.trim()
      ? `${titleLine} · ${artistName.trim()}`
      : titleLine;

    toast.custom((id) => {
      return (
        <ToastContent
          title={`Added to ${playlistName}`}
          description={description}
          actionLabel="Open playlist"
          onAction={() => {
            toast.dismiss(id);
            router.push(`/playlist/${playlistId}`);
          }}
        />
      );
    });
  };

  const handleCreatePlaylist = async (name: string) => {
    const playlist = await createPlaylist({
      name,
    });

    if (!playlist) {
      toast.error("Couldn't create playlist", {
        description: "Please check your connection and try again.",
      });
      return;
    }

    const added = await addTrackToPlaylist({
      playlistId: playlist.id,
      trackId,
      trackName,
      artistName,
      albumName,
      albumId,
      thumbnailUrl,
      durationMs,
    });

    if (added) {
      setTrackInPlaylist((prev) => ({ ...prev, [playlist.id]: true }));
      setPlaylistTrackCounts((prev) => ({ ...prev, [playlist.id]: 1 }));
      openPlaylistToast(playlist.id, playlist.name);
    } else {
      toast.custom((id) => {
        return (
          <ToastContent
            title="Playlist created, but the song wasn't added"
            description="Open the playlist and try again, or add the track from the album page."
            actionLabel="Open playlist"
            onAction={() => {
              toast.dismiss(id);
              router.push(`/playlist/${playlist.id}`);
            }}
          />
        );
      });
    }
  };

  const handleAddToPlaylist = async (playlistId: string) => {
    const playlist = songPlaylists.find((p) => p.id === playlistId);
    const playlistName = playlist?.name ?? "playlist";

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
      openPlaylistToast(playlistId, playlistName);
      setTrackInPlaylist((prev) => ({ ...prev, [playlistId]: true }));
      setPlaylistTrackCounts((prev) => ({
        ...prev,
        [playlistId]: (prev[playlistId] || 0) + 1,
      }));
    } else {
      toast.error(`Couldn't add to ${playlistName}`, {
        description:
          "This song may already be in that playlist, or something went wrong.",
      });
    }

    return success;
  };

  const handleRemoveFromPlaylist = async (playlistId: string) => {
    const playlist = songPlaylists.find((p) => p.id === playlistId);
    const playlistName = playlist?.name ?? "playlist";
    try {
      await removeTrackFromPlaylist(playlistId, trackId);
      setTrackInPlaylist((prev) => ({ ...prev, [playlistId]: false }));
      setPlaylistTrackCounts((prev) => ({
        ...prev,
        [playlistId]: Math.max(0, (prev[playlistId] || 0) - 1),
      }));
      toast.custom((id) => {
        return (
          <ToastContent
            title={`Removed from ${playlistName}`}
            description={
              trackName?.trim()
                ? `${trackName.trim()}${artistName?.trim() ? ` · ${artistName.trim()}` : ""}`
                : undefined
            }
            actionLabel="Open playlist"
            onAction={() => {
              toast.dismiss(id);
              router.push(`/playlist/${playlistId}`);
            }}
          />
        );
      });
      return true;
    } catch (e) {
      console.error("Error removing track from playlist:", e);
      toast.error(`Couldn't remove from ${playlistName}`, {
        description: "Please try again.",
      });
      return false;
    }
  };

  return (
    <BasePlaylistSelectorModal
      title="Add Song to Playlist"
      onClose={onClose}
      loading={loading}
      playlists={songPlaylists}
      onCreatePlaylist={handleCreatePlaylist}
      onAddToPlaylist={handleAddToPlaylist}
      onRemoveFromPlaylist={handleRemoveFromPlaylist}
      removeConfirmTitle="Remove this song from this playlist?"
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
