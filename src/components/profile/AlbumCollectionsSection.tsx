"use client";

import { useEffect, useMemo, useState } from "react";
import { FaLayerGroup, FaCompactDisc } from "react-icons/fa";
import type { IconType } from "react-icons";
import { createClient } from "@/utils/supabase/client";
import EditPlaylistModal from "@/components/playlist/EditPlaylistModal";
import ProfileSectionHeader from "@/components/profile/ProfileSectionHeader";
import StackedCard from "@/components/ui/StackedCard";
import { usePlaylistCollectionActions } from "@/hooks/usePlaylistCollectionActions";
import {
  fetchAlbumCollections,
  type CollectionCardData,
} from "@/lib/albumCollections";

export type { CollectionCardData };

interface AlbumCollectionsSectionProps {
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
    <div className="py-16 text-center border-2 border-dashed border-neutral-200 rounded-2xl bg-neutral-50">
      <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
        <Icon size={24} className="text-neutral-400" />
      </div>
      <p className="text-neutral-900 font-bold text-lg mb-1">{title}</p>
      <p className="text-neutral-500 text-sm">{description}</p>
    </div>
  );
}

export default function AlbumCollectionsSection({
  userId,
  isPrivate = false,
}: AlbumCollectionsSectionProps) {
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
        const mapped = await fetchAlbumCollections(supabase, userId, 3);
        if (!cancelled) setCollections(mapped);
      } catch (e) {
        console.error("Failed to load album collections:", e);
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
        title="Album playlists"
        count={!isPrivate && !loading ? filteredCollections.length : undefined}
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Search playlists..."
      />

      {isPrivate ? (
        <EmptyState
          icon={FaLayerGroup}
          title="Album playlist is private"
          description="This user has chosen to hide their album playlist"
        />
      ) : loading ? (
        <div className="py-10 flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-neutral-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filteredCollections.length === 0 ? (
        <EmptyState
          icon={FaCompactDisc}
          title={searchQuery ? "No playlists found" : "No album playlists yet"}
          description={
            searchQuery
              ? "Try a different search term"
              : "Create an album playlist and add albums to see them here"
          }
        />
      ) : (
        <div className="grid grid-cols-2 gap-9 sm:grid-cols-3 lg:grid-cols-4">
          {filteredCollections.map((collection) => (
            <StackedCard
              key={collection.id}
              title={collection.name}
              itemCount={collection.itemCount}
              href={`/playlist/${collection.id}`}
              coverUrls={collection.coverUrls.slice(0, 3)}
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
