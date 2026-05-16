"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { FaListUl, FaMusic, FaCompactDisc, FaPlay } from "react-icons/fa";
import { LuArrowLeft, LuPencil, LuTrash2 } from "react-icons/lu";
import { usePlaylist } from "@/context/PlaylistContext";
import { useAuth } from "@/context/AuthContext";
import { Playlist, PlaylistTrack, PlaylistAlbum } from "@/types/playlist";
import { Album } from "@/types/music";
import { createClient } from "@/utils/supabase/client";
import ArtistAlbumGridSection from "@/components/artist/ArtistAlbumGridSection";
import Button from "@/components/ui/Button";
import MySection from "@/components/ui/MySection";
import { cn } from "@/lib/utils";
import { PAGE_CONTENT_TOP } from "@/lib/pageLayout";
import { usePlayerCore } from "@/context/PlayerContext";
import SongRow from "@/main-components/SongRow";
import EditPlaylistModal from "@/components/playlist/EditPlaylistModal";

export default function PlaylistPage() {
  const params = useParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { deletePlaylist } = usePlaylist();
  const { playTrack } = usePlayerCore();

  const playlistId = params.id as string;

  const [playlist, setPlaylist] = useState<Playlist | null>(null);
  const [tracks, setTracks] = useState<PlaylistTrack[]>([]);
  const [albums, setAlbums] = useState<PlaylistAlbum[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [savingEdits, setSavingEdits] = useState(false);
  const [editName, setEditName] = useState("");

  // Fetch playlist + items directly from Supabase in one shot
  const loadPlaylistData = useCallback(async () => {
    if (!user || !playlistId) return;

    const supabase = createClient();

    // Fetch playlist metadata
    const { data: playlistData, error: playlistError } = await supabase
      .from("playlists")
      .select("*")
      .eq("id", playlistId)
      .eq("user_id", user.id)
      .single();

    if (playlistError || !playlistData) {
      setNotFound(true);
      setLoading(false);
      return;
    }

    const pl = playlistData as Playlist;
    setPlaylist(pl);

    // Fetch items based on type
    if (pl.type === "albums") {
      const { data: albumData } = await supabase
        .from("playlist_albums")
        .select("*")
        .eq("playlist_id", playlistId)
        .order("position", { ascending: true });
      setAlbums((albumData as PlaylistAlbum[]) || []);
    } else {
      const { data: trackData } = await supabase
        .from("playlist_tracks")
        .select("*")
        .eq("playlist_id", playlistId)
        .order("position", { ascending: true });
      setTracks((trackData as PlaylistTrack[]) || []);
    }

    setLoading(false);
  }, [user, playlistId]);

  useEffect(() => {
    if (!authLoading && user) {
      loadPlaylistData();
    } else if (!authLoading && !user) {
      router.push("/login");
    }
  }, [authLoading, user, loadPlaylistData, router]);

  useEffect(() => {
    if (!playlist) return;
    setEditName(playlist.name || "");
  }, [playlist]);

  const handleDeletePlaylist = async () => {
    if (!playlist) return;
    if (!confirm("Are you sure you want to delete this playlist?")) return;
    setDeleting(true);
    await deletePlaylist(playlist.id);
    router.push("/profile");
  };

  const handleSaveEdits = async () => {
    if (!user || !playlist) return;
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
        .eq("user_id", user.id)
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

  const queue = useMemo(() => {
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
      totalTracks: tracks.length,
    }));
  }, [playlist, tracks]);

  // Loading state
  if (authLoading || loading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="font-mono text-neutral-500 animate-pulse text-xs tracking-widest uppercase">
          Loading...
        </div>
      </main>
    );
  }

  // Not logged in
  if (!user) {
    return null;
  }

  // Playlist not found
  if (notFound || !playlist) {
    return (
      <main className="min-h-screen">
        <MySection className={cn(PAGE_CONTENT_TOP)}>
          <div className="w-full max-w-4xl">
            <Link
              href="/profile"
              className="inline-flex items-center gap-2 text-neutral-500 hover:text-neutral-900 transition-colors text-sm font-mono mb-8"
            >
              <LuArrowLeft size={14} />
              Back to profile
            </Link>
            <div className="py-16 text-center">
              <FaListUl size={32} className="text-neutral-700 mx-auto mb-4" />
              <p className="text-neutral-500 font-mono text-sm">
                Playlist not found
              </p>
            </div>
          </div>
        </MySection>
      </main>
    );
  }

  return (
    <main className="min-h-screen">
      <div className="relative w-full overflow-hidden bg-linear-[to_right,#DF4627_0%,#660F11_33%,#3C0C0F_66%,#260E1C_100%]">
      
        <div className="relative z-10 mx-auto w-full max-w-[1180px] px-4 sm:px-6 py-10 bg-gradient-to-r">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-5 min-w-0">
                <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-xl bg-white/15 backdrop-blur-md flex items-center justify-center shrink-0">
                  {playlist.type === "albums" ? (
                    <FaCompactDisc size={30} className="text-white/90" />
                  ) : (
                    <FaListUl size={28} className="text-white/90" />
                  )}
                </div>

                <div className="min-w-0">
                  <div className="text-xs font-mono uppercase tracking-widest text-white/70">
                    Playlist
                  </div>
                  <h1 className="mt-1 text-3xl sm:text-4xl font-medium tracking-tight text-white whitespace-normal break-words">
                    {playlist.name}
                  </h1>
                  <div className="mt-2 text-sm font-mono text-white/75 flex flex-wrap items-center gap-x-2 gap-y-1">
                    <span>
                      {playlist.type === "albums"
                        ? `${albums.length} albums`
                        : `${tracks.length} tracks`}
                    </span>
                    <span className="text-white/45">/</span>
                    <span>
                      Created{" "}
                      {new Date(playlist.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>

              {playlist.type === "songs" ? (
                <button
                  type="button"
                  onClick={() => {
                    if (queue.length > 0) playTrack(queue[0], queue);
                  }}
                  disabled={queue.length === 0}
                  className={cn(
                    "shrink-0 group flex items-center gap-2 rounded-full bg-white px-4 py-3 font-mono font-semibold text-neutral-900 transition-transform",
                    queue.length > 0
                      ? "hover:scale-105 active:scale-95"
                      : "opacity-60 cursor-not-allowed",
                  )}
                >
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#e76418] text-white transition-transform group-hover:scale-105">
                    <FaPlay className="ml-0.5" size={12} />
                  </div>
                  <span className="text-sm sm:text-base font-bold tracking-tight">
                    Play songs
                  </span>
                </button>
              ) : null}
            </div>
        </div>
      </div>

      <MySection className={cn("pb-20")} container={false}>
        <div className="mx-auto w-full max-w-[1180px] px-4 sm:px-6">
          {/* Options row (album header button style) */}
          <div className="mb-8 flex flex-wrap items-center justify-between gap-3 pt-12">
            <Button
              href="/profile"
              variant="secondary"
              size="xs"
              iconLeft={<LuArrowLeft size={14} className=" mr-2" />}
            >
              BACK TO PLAYLISTS
            </Button>

            <div className="flex items-center gap-3">
              <Button
                onClick={() => setShowEditModal(true)}
                variant="secondary"
                size="xs"
                iconLeft={<LuPencil size={14} className=" mr-2" />}
              >
                EDIT DETAILS
              </Button>

              <Button
                onClick={handleDeletePlaylist}
                disabled={deleting}
                variant="secondary"
                size="xs"
                className="text-neutral-900"
                iconLeft={<LuTrash2 size={14} className=" mr-2" />}
              >
                {deleting ? "DELETING..." : "DELETE"}
              </Button>
            </div>
          </div>

          {/* Content */}
          {playlist?.type === "albums" ? (
            /* Album Playlist Content */
            albums.length === 0 ? (
              <div className="py-16 text-center border border-[#e1e1e1] bg-white rounded-md">
                <FaCompactDisc
                  size={32}
                  className="text-neutral-700 mx-auto mb-4"
                />
                <p className="text-neutral-600 font-mono text-sm">
                  No albums in this playlist
                </p>
                <p className="text-neutral-700 text-xs mt-1">
                  Add albums from album pages
                </p>
              </div>
            ) : (
              <ArtistAlbumGridSection
                albums={playlistAlbums}
                initialCount={playlistAlbums.length}
                ratingMode="any"
                columns={4}
              />
            )
          ) : /* Song Playlist Content */
          tracks.length === 0 ? (
            <div className="py-16 text-center border border-[#e1e1e1] bg-white rounded-md">
              <FaMusic size={32} className="text-neutral-700 mx-auto mb-4" />
              <p className="text-neutral-600 font-mono text-sm">
                No tracks in this playlist
              </p>
              <p className="text-neutral-700 text-xs mt-1">
                Add tracks from album pages
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-y-1.5">
              {queue.map((t, i) => (
                <SongRow
                  key={`${t.id}-${i}`}
                  index={i + 1}
                  title={t.title}
                  artist={t.artistName || "Unknown Artist"}
                  album={t.albumTitle || playlist.name}
                  duration={String(tracks[i]?.duration_ms ?? "")}
                  artworkUrl={t.albumImageUrl || "/vinyl-placeholder.svg"}
                  track={t as any}
                  artistId=""
                  albumId={t.albumId || ""}
                  albumContext={{
                    albumId: t.albumId || "",
                    title: t.albumTitle || playlist.name,
                    artistName: t.artistName || "Unknown Artist",
                    totalTracks: tracks.length,
                    artworkUrl: t.albumImageUrl || undefined,
                  }}
                />
              ))}
            </div>
          )}
        </div>
      </MySection>

      {showEditModal && playlist && (
        <EditPlaylistModal
          name={editName}
          saving={savingEdits}
          onNameChange={setEditName}
          onClose={() => setShowEditModal(false)}
          onSave={handleSaveEdits}
        />
      )}
    </main>
  );
}
