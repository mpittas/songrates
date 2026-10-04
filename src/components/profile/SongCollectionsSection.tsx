"use client";

import { useEffect, useMemo, useState } from "react";
import { FaMusic, FaListUl } from "react-icons/fa";
import type { IconType } from "react-icons";
import { createClient } from "@/utils/supabase/client";
import EditPlaylistModal from "@/components/playlist/EditPlaylistModal";
import ProfileSectionHeader from "@/components/profile/ProfileSectionHeader";
import SharedEmptyState from "@/components/ui/EmptyState";
import StackedCard from "@/components/ui/StackedCard";
import { usePlaylistCollectionActions } from "@/hooks/usePlaylistCollectionActions";
import type { Playlist } from "@/types/playlist";
import type { CollectionCardData } from "@/components/profile/AlbumCollectionsSection";

type SongPlaylist = Playlist & { itemCount: number };

type PlaylistRow = Playlist & {
  playlist_tracks?: { count: number }[];
};

type TrackPreviewRow = {
  playlist_id: string;
  thumbnail_url: string | null;
  position: number;
};

interface SongCollectionsSectionProps {
  userId: string;
  isPrivate?: boolean;
}

function EmptyState({
  icon: Icon,
  title,
  description,
}: {
  icon: IconType;
  title: string;
  description: string;
}) {
  return (
    <SharedEmptyState
      icon={<Icon size={20} />}
      title={title}
      description={description}
    />
  );
}

export default function SongCollectionsSection({
  userId,
  isPrivate = false,
}: SongCollectionsSectionProps) {
  const [collections, setCollections] = useState<CollectionCardData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const {
    isOwner,
    handleDeletePlaylist,
    openEditPlaylist,
    editingPlaylistId,
    editName,
    setEditName,
    savingEdits,
    closeEditPlaylist,
    handleSavePlaylistEdits,
  } = usePlaylistCollectionActions(userId, setCollections);

  useEffect(() => {
    if (isPrivate) {
      setCollections([]);
      setLoading(false);
      return;
    }

    let cancelled = false;

    const load = async () => {
      setLoading(true);
      try {
        const supabase = createClient();

        const { data: playlistData, error: playlistError } = await supabase
          .from("playlists")
          .select(
            "id, user_id, name, type, created_at, updated_at, playlist_tracks(count)",
          )
          .eq("user_id", userId)
          .eq("type", "songs")
          .order("created_at", { ascending: false });

        if (playlistError || !playlistData) {
          if (!cancelled) setCollections([]);
          return;
        }

        const songPlaylists: SongPlaylist[] = (
          playlistData as PlaylistRow[]
        ).map((p) => {
          const tracksCount =
            Array.isArray(p.playlist_tracks) &&
            p.playlist_tracks[0]?.count != null
              ? Number(p.playlist_tracks[0].count)
              : 0;

          return {
            id: p.id,
            user_id: p.user_id,
            name: p.name,
            type: p.type,
            created_at: p.created_at,
            updated_at: p.updated_at,
            itemCount: tracksCount,
          };
        });

        const playlistIds = songPlaylists.map((p) => p.id);
        const previewsByPlaylist = new Map<string, string[]>();

        if (playlistIds.length > 0) {
          const { data: previewData } = await supabase
            .from("playlist_tracks")
            .select("playlist_id, thumbnail_url, position")
            .in("playlist_id", playlistIds)
            .order("position", { ascending: true });

          for (const row of (previewData || []) as TrackPreviewRow[]) {
            if (!row.thumbnail_url) continue;
            const existing = previewsByPlaylist.get(row.playlist_id) || [];
            if (existing.length < 3) {
              existing.push(row.thumbnail_url);
              previewsByPlaylist.set(row.playlist_id, existing);
            }
          }
        }

        const mapped: CollectionCardData[] = songPlaylists.map((p) => {
          const previews = previewsByPlaylist.get(p.id) || [];
          const [first, second, third] = previews;
          return {
            id: p.id,
            name: p.name,
            itemCount: p.itemCount,
            coverUrls: [first, second, third],
          };
        });

        if (!cancelled) setCollections(mapped);
      } catch (e) {
        console.error("Failed to load song collections:", e);
        if (!cancelled) setCollections([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [userId, isPrivate]);

  const filteredCollections = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return collections;
    return collections.filter((c) => c.name.toLowerCase().includes(q));
  }, [collections, searchQuery]);

  return (
    <section>
      <ProfileSectionHeader
        title="Song playlists"
        count={!isPrivate && !loading ? filteredCollections.length : undefined}
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Search playlists..."
      />

      {isPrivate ? (
        <EmptyState
          icon={FaListUl}
          title="Songs playlist is private"
          description="This user has chosen to hide their songs playlist"
        />
      ) : loading ? (
        <div className="py-10 flex items-center justify-center">
          <div className="size-6 animate-spin rounded-full border-2 border-ink/15 border-t-ink" />
        </div>
      ) : filteredCollections.length === 0 ? (
        <EmptyState
          icon={FaMusic}
          title={searchQuery ? "No playlists found" : "No song playlists yet"}
          description={
            searchQuery
              ? "Try a different search term"
              : "Create a song playlist and add tracks to see them here"
          }
        />
      ) : (
        <div className="grid grid-cols-2 gap-9 sm:grid-cols-3 lg:grid-cols-4">
          {filteredCollections.map((collection) => (
            <StackedCard
              key={collection.id}
              title={collection.name}
              itemCount={collection.itemCount}
              itemLabel="songs"
              href={`/playlist/${collection.id}`}
              coverUrls={collection.coverUrls}
              onEdit={
                isOwner
                  ? () => openEditPlaylist(collection.id, collection.name)
                  : undefined
              }
              onDelete={
                isOwner
                  ? () => handleDeletePlaylist(collection.id, collection.name)
                  : undefined
              }
            />
          ))}
        </div>
      )}

      {editingPlaylistId ? (
        <EditPlaylistModal
          name={editName}
          saving={savingEdits}
          onNameChange={setEditName}
          onClose={closeEditPlaylist}
          onSave={handleSavePlaylistEdits}
        />
      ) : null}
    </section>
  );
}
