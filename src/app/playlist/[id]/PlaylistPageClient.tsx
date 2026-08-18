"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { FaArrowLeft, FaMusic, FaCompactDisc } from "react-icons/fa";
import { LuPencil, LuTrash2 } from "react-icons/lu";

import { usePlaylist } from "@/context/PlaylistContext";
import { Playlist, PlaylistTrack, PlaylistAlbum } from "@/types/playlist";
import { Album, Track } from "@/types/music";
import { createClient } from "@/utils/supabase/client";
import ArtistAlbumGridSection from "@/components/artist/ArtistAlbumGridSection";
import Button from "@/components/ui/Button";
import CollectionDetailPageLayout from "@/components/layout/CollectionDetailPageLayout";
import { usePlayerCore } from "@/context/PlayerContext";
import SongRow from "@/main-components/SongRow";
import EditPlaylistModal from "@/components/playlist/EditPlaylistModal";

interface PlaylistPageClientProps {
  initialPlaylist: Playlist | null;
  initialTracks: PlaylistTrack[];
  initialAlbums: PlaylistAlbum[];
}

function CollectionEmptyState({
  icon: Icon,
  title,
  description,
}: {
  icon: typeof FaMusic;
  title: string;
  description: string;
}) {
  return (
    <div className="py-20 text-center">
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-white ring-1 ring-neutral-200">
        <Icon size={20} className="text-neutral-400" />
      </div>
      <p className="mb-1 text-base font-semibold text-neutral-900">{title}</p>
      <p className="text-sm text-neutral-500">{description}</p>
    </div>
  );
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
      <CollectionDetailPageLayout
        topBarLeft={
          <Button
            href="/profile"
            variant="secondary"
            size="xs"
            iconLeft={<FaArrowLeft size={14} className="mr-2" />}
          >
            BACK TO PROFILE
          </Button>
        }
        artworkSrc="/vinyl-placeholder.svg"
        artworkAlt="Playlist not found"
        title="Playlist not found"
        subtitle={
          <p className="mb-4 text-md text-neutral-600">
            This playlist is missing or was deleted.
          </p>
        }
        list={
          <p className="py-16 text-center text-sm text-neutral-500">
            Try another playlist from your profile.
          </p>
        }
      />
    );
  }

  const isAlbums = playlist.type === "albums";
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

  const listContent = isAlbums
    ? albums.length === 0
      ? (
          <CollectionEmptyState
            icon={FaCompactDisc}
            title="No albums yet"
            description="Add albums from any album page."
          />
        )
      : filteredAlbums.length === 0
        ? (
            <p className="py-12 text-center text-sm text-neutral-500">
              No albums match “{searchQuery}”.
            </p>
          )
        : (
            <ArtistAlbumGridSection
              albums={filteredAlbums}
              initialCount={filteredAlbums.length}
              ratingMode="any"
              columns={4}
            />
          )
    : tracks.length === 0
      ? (
          <CollectionEmptyState
            icon={FaMusic}
            title="No tracks yet"
            description="Add tracks from any album page."
          />
        )
      : filteredQueue.length === 0
        ? (
            <p className="py-12 text-center text-sm text-neutral-500">
              No tracks match “{searchQuery}”.
            </p>
          )
        : (
            <div className="flex flex-col gap-y-1.5">
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
                  albumContext={{
                    albumId: t.albumId || "",
                    title: t.albumTitle || playlist.name,
                    artistName: t.artistName || "Unknown Artist",
                    artworkUrl: t.albumImageUrl || undefined,
                  }}
                />
              ))}
            </div>
          );

  return (
    <>
      <CollectionDetailPageLayout
        topBarLeft={
          <Button
            href={backHref}
            variant="secondary"
            size="xs"
            iconLeft={<FaArrowLeft size={14} className="mr-2" />}
          >
            BACK TO PLAYLISTS
          </Button>
        }
        topBarRight={
          <>
            <Button
              onClick={() => setShowEditModal(true)}
              variant="secondary"
              size="xs"
              iconLeft={<LuPencil size={14} className="mr-2" />}
            >
              EDIT
            </Button>
            <Button
              onClick={handleDeletePlaylist}
              disabled={deleting}
              variant="secondary"
              size="xs"
              iconLeft={<LuTrash2 size={14} className="mr-2" />}
            >
              {deleting ? "DELETING..." : "DELETE"}
            </Button>
          </>
        }
        artworkSrc={coverSrc || "/vinyl-placeholder.svg"}
        artworkAlt={playlist.name}
        onPlayClick={
          isAlbums
            ? undefined
            : () => {
                if (queue.length > 0) playTrack(queue[0], queue);
              }
        }
        playLabel="Play playlist"
        playDisabled={!isAlbums && queue.length === 0}
        title={playlist.name}
        subtitle={
          <p className="mb-4 text-md text-neutral-600">
            {isAlbums ? "Album playlist" : "Song playlist"}
          </p>
        }
        metaRow={
          <>
            <span className="rounded bg-neutral-100 px-2 py-1 text-xs font-semibold text-neutral-700">
              {isAlbums ? "Albums" : "Songs"}
            </span>
            <span>•</span>
            <span>{countLabel}</span>
            <span>•</span>
            <span>{createdLabel}</span>
          </>
        }
        listHeading={isAlbums ? "Albums" : "Tracklist"}
        searchQuery={searchQuery}
        onSearchQueryChange={setSearchQuery}
        onSearchClear={() => setSearchQuery("")}
        onSearchFocus={() => setIsSearchFocused(true)}
        onSearchBlur={() => setIsSearchFocused(false)}
        searchFocused={isSearchFocused}
        searchPlaceholder={isAlbums ? "search albums..." : "search tracks..."}
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
