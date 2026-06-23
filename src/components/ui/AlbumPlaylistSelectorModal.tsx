"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { FaCompactDisc } from "react-icons/fa";
import { usePlaylist } from "@/context/PlaylistContext";
import BasePlaylistSelectorModal from "./BasePlaylistSelectorModal";
import ToastContent from "./ToastContent";
import { createSlug } from "@/lib/utils";

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
  const router = useRouter();
  const {
    playlists,
    loading,
    createPlaylist,
    addAlbumToPlaylist,
    getAlbumPlaylistSummaries,
  } = usePlaylist();

  const [playlistAlbumCounts, setPlaylistAlbumCounts] = useState<
    Record<string, number>
  >({});
  const [albumInPlaylist, setAlbumInPlaylist] = useState<
    Record<string, boolean>
  >({});

  const albumPlaylists = useMemo(
    () => playlists.filter((p) => p.type === "albums"),
    [playlists],
  );

  useEffect(() => {
    let cancelled = false;

    const checkAlbums = async () => {
      if (albumPlaylists.length === 0) {
        await Promise.resolve();
        if (!cancelled) {
          setPlaylistAlbumCounts({});
          setAlbumInPlaylist({});
        }
        return;
      }

      const summaries = await getAlbumPlaylistSummaries(
        albumId,
        albumPlaylists.map((playlist) => playlist.id),
      );

      if (cancelled) return;

      setPlaylistAlbumCounts(
        Object.fromEntries(
          Object.entries(summaries).map(([id, summary]) => [
            id,
            summary.count,
          ]),
        ),
      );
      setAlbumInPlaylist(
        Object.fromEntries(
          Object.entries(summaries).map(([id, summary]) => [
            id,
            summary.containsItem,
          ]),
        ),
      );
    };

    checkAlbums();
    return () => {
      cancelled = true;
    };
  }, [albumPlaylists, albumId, getAlbumPlaylistSummaries]);

  const openPlaylistToast = (playlistId: string, playlistName: string) => {
    const titleLine = albumName?.trim() || "Album";
    const description = artistName?.trim()
      ? `${titleLine} · ${artistName.trim()}`
      : titleLine;

    toast.custom((id) => {
      return (
        <ToastContent
          title={`Album added to ${playlistName}`}
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
      type: "albums",
    });

    if (!playlist) {
      toast.error("Couldn't create playlist", {
        description: "Please check your connection and try again.",
      });
      return;
    }

    const added = await addAlbumToPlaylist({
      playlistId: playlist.id,
      albumId,
      albumName,
      artistName,
      thumbnailUrl,
      releaseDate,
      totalTracks,
    });

    if (added) {
      setAlbumInPlaylist((prev) => ({ ...prev, [playlist.id]: true }));
      setPlaylistAlbumCounts((prev) => ({ ...prev, [playlist.id]: 1 }));
      openPlaylistToast(playlist.id, playlist.name);
    } else {
      toast.custom((id) => {
        return (
          <ToastContent
            title="Playlist created, but the album wasn't added"
            description="Open the playlist and try again, or add the album from its page."
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
    const playlist = albumPlaylists.find((p) => p.id === playlistId);
    const playlistName = playlist?.name ?? "playlist";

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
      openPlaylistToast(playlistId, playlistName);
      setAlbumInPlaylist((prev) => ({ ...prev, [playlistId]: true }));
      setPlaylistAlbumCounts((prev) => ({
        ...prev,
        [playlistId]: (prev[playlistId] || 0) + 1,
      }));
    } else {
      toast.error(`Couldn't add album to ${playlistName}`, {
        description:
          "This album may already be in that playlist, or something went wrong.",
      });
    }

    return success;
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
      itemHref={
        albumName ? `/album/${createSlug(albumName, albumId)}` : undefined
      }
    />
  );
}
