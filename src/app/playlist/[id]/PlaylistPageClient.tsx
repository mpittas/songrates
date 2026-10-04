"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  LuDisc3,
  LuListMusic,
  LuMusic,
  LuPencil,
  LuTrash2,
} from "react-icons/lu";

import { usePlaylist } from "@/context/PlaylistContext";
import { Playlist, PlaylistTrack, PlaylistAlbum } from "@/types/playlist";
import { Album, Track } from "@/types/music";
import { createClient } from "@/utils/supabase/client";
import ArtistAlbumGridSection from "@/components/artist/ArtistAlbumGridSection";
import Button from "@/components/ui/Button";
import CollectionDetailPageLayout, {
  MetaDot,
} from "@/components/layout/CollectionDetailPageLayout";
import EmptyState from "@/components/ui/EmptyState";
import TrackList from "@/components/ui/TrackList";
import { PAGE_CONTAINER } from "@/lib/pageLayout";
import { cn } from "@/lib/utils";
import { usePlayerCore } from "@/context/PlayerContext";
import SongRow from "@/main-components/SongRow";
import EditPlaylistModal from "@/components/playlist/EditPlaylistModal";
import { playlistPlaybackSource } from "@/lib/playbackSource";

interface PlaylistPageClientProps {
  initialPlaylist: Playlist | null;
  initialTracks: PlaylistTrack[];
  initialAlbums: PlaylistAlbum[];
}

export default function PlaylistPageClient({
  initialPlaylist,
  initialTracks,
  initialAlbums,
}: PlaylistPageClientProps) {
  const router = useRouter();
  const { deletePlaylist } = usePlaylist();
  const { playTrack } = usePlayerCore();

  const [playlist, setPlaylist] = useState<Playlist | null>(initialPlaylist);
  const [tracks] = useState<PlaylistTrack[]>(initialTracks);
  const [albums] = useState<PlaylistAlbum[]>(initialAlbums);
  const [deleting, setDeleting] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [savingEdits, setSavingEdits] = useState(false);
  const [editName, setEditName] = useState(initialPlaylist?.name || "");
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  const backHref =
    playlist?.type === "albums"
      ? "/profile/album-playlist"
      : "/profile/songs-playlist";

  const handleDeletePlaylist = async () => {
    if (!playlist) return;
    if (!confirm("Are you sure you want to delete this playlist?")) return;
    setDeleting(true);
    await deletePlaylist(playlist.id);
    router.push(backHref);
  };

  const handleSaveEdits = async () => {
    if (!playlist) return;
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
        .eq("id", playlist.id)
        .eq("user_id", playlist.user_id)
        .select("*")
        .single();

      if (!error && data) {
        setPlaylist(data as Playlist);
        setShowEditModal(false);
      }
    } finally {
      setSavingEdits(false);
    }
  };

  const playlistAlbums: Album[] = useMemo(
    () =>
      albums.map((a) => ({
        id: a.album_id,
        title: a.album_name || "Unknown Album",
        artistName: a.artist_name || undefined,
        artworkUrl: a.thumbnail_url || undefined,
        releaseDate: a.release_date || undefined,
      })),
    [albums],
  );

  const queue = useMemo<Track[]>(() => {
    if (!playlist || playlist.type !== "songs") return [];
    return tracks.map((t, i) => ({
      id: t.track_id,
      number: String(i + 1),
      title: t.track_name || "Unknown Track",
      length: t.duration_ms || 0,
      artists: t.artist_name ? [{ id: "", name: t.artist_name }] : [],
      artistName: t.artist_name || "Unknown Artist",
      artistId: "",
      albumId: t.album_id || "",
      albumTitle: t.album_name || playlist.name,
      albumImageUrl: t.thumbnail_url || "/vinyl-placeholder.svg",
    }));
  }, [playlist, tracks]);

  const q = searchQuery.toLowerCase();

  const filteredQueue = useMemo(() => {
    return queue
      .map((track, index) => ({ track, index }))
      .filter(({ track }) => {
        if (!q) return true;
        return (
          track.title.toLowerCase().includes(q) ||
          (track.artistName || "").toLowerCase().includes(q) ||
          (track.albumTitle || "").toLowerCase().includes(q)
        );
      });
  }, [queue, q]);

  const filteredAlbums = useMemo(() => {
    if (!q) return playlistAlbums;
    return playlistAlbums.filter(
      (a) =>
        a.title.toLowerCase().includes(q) ||
        (a.artistName || "").toLowerCase().includes(q),
    );
  }, [playlistAlbums, q]);

  const coverSrc =
    playlist?.type === "albums"
      ? albums.find((album) => album.thumbnail_url)?.thumbnail_url
      : tracks.find((track) => track.thumbnail_url)?.thumbnail_url;

  if (!playlist) {
    return (
      <main className={cn(PAGE_CONTAINER, "min-h-[60vh] py-16")}>
        <EmptyState
          icon={<LuListMusic size={22} />}
          title="Playlist not found"
          description="This playlist is missing or was deleted."
          action={
            <Button href="/profile" variant="primary" size="md">
              Back to your profile
            </Button>
          }
        />
      </main>
    );
  }

  const isAlbums = playlist.type === "albums";
  const playbackSource = playlistPlaybackSource(playlist.id, playlist.name);
  const countLabel = isAlbums
    ? `${albums.length} ${albums.length === 1 ? "album" : "albums"}`
    : `${tracks.length} ${tracks.length === 1 ? "track" : "tracks"}`;
  const createdLabel = new Date(playlist.created_at).toLocaleDateString(
    "en-US",
    {
      month: "short",
      day: "numeric",
      year: "numeric",
    },
  );

  const listContent = isAlbums ? (
    albums.length === 0 ? (
      <EmptyState
        compact
        icon={<LuDisc3 size={20} />}
        title="No albums yet"
        description="Save albums here from any album page."
      />
    ) : filteredAlbums.length === 0 ? (
      <EmptyState compact title={`No albums match “${searchQuery}”`} />
    ) : (
      <ArtistAlbumGridSection
        albums={filteredAlbums}
        initialCount={filteredAlbums.length}
        ratingMode="any"
        columns={4}
      />
    )
  ) : tracks.length === 0 ? (
    <EmptyState
      compact
      icon={<LuMusic size={20} />}
      title="No tracks yet"
      description="Add songs here from any track menu."
    />
  ) : filteredQueue.length === 0 ? (
    <EmptyState compact title={`No tracks match “${searchQuery}”`} />
  ) : (
    <TrackList>
      {filteredQueue.map(({ track: t, index }) => (
        <SongRow
          key={`${t.id}-${index}`}
          index={index + 1}
          title={t.title}
          artist={t.artistName || "Unknown Artist"}
          album={t.albumTitle || playlist.name}
          duration={String(tracks[index]?.duration_ms ?? "")}
          artworkUrl={t.albumImageUrl || "/vinyl-placeholder.svg"}
          track={t}
          artistId=""
          albumId={t.albumId || ""}
          queue={queue}
          playbackSource={playbackSource}
          albumContext={{
            albumId: t.albumId || "",
            title: t.albumTitle || playlist.name,
            artistName: t.artistName || "Unknown Artist",
            artworkUrl: t.albumImageUrl || undefined,
          }}
        />
      ))}
    </TrackList>
  );

  return (
    <>
      <CollectionDetailPageLayout
        back={{ href: backHref, label: "Your playlists" }}
        actions={
          <>
            <Button
              onClick={() => setShowEditModal(true)}
              variant="border"
              size="lg"
              icon
              aria-label="Rename playlist"
              title="Rename playlist"
            >
              <LuPencil size={17} />
            </Button>
            <Button
              onClick={handleDeletePlaylist}
              disabled={deleting}
              variant="border"
              size="lg"
              icon
              aria-label={deleting ? "Deleting playlist" : "Delete playlist"}
              title="Delete playlist"
            >
              <LuTrash2 size={17} />
            </Button>
          </>
        }
        artworkSrc={coverSrc || "/vinyl-placeholder.svg"}
        artworkAlt={playlist.name}
        onPlayClick={
          isAlbums
            ? undefined
            : () => {
                if (queue.length > 0)
                  playTrack(queue[0], queue, playbackSource);
              }
        }
        playLabel="Play"
        playDisabled={!isAlbums && queue.length === 0}
        eyebrow={isAlbums ? "Album playlist" : "Song playlist"}
        title={playlist.name}
        metaRow={
          <>
            <span>{countLabel}</span>
            <MetaDot />
            <span>Created {createdLabel}</span>
          </>
        }
        listCount={isAlbums ? albums.length : tracks.length}
        listHeading={isAlbums ? "Albums" : "Tracklist"}
        searchQuery={searchQuery}
        onSearchQueryChange={setSearchQuery}
        onSearchClear={() => setSearchQuery("")}
        onSearchFocus={() => setIsSearchFocused(true)}
        onSearchBlur={() => setIsSearchFocused(false)}
        searchFocused={isSearchFocused}
        searchPlaceholder={isAlbums ? "Search albums" : "Search tracks"}
        list={listContent}
      />

      {showEditModal && playlist && (
        <EditPlaylistModal
          name={editName}
          saving={savingEdits}
          onNameChange={setEditName}
          onClose={() => setShowEditModal(false)}
          onSave={handleSaveEdits}
        />
      )}
    </>
  );
}
