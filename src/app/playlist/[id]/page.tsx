"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  FaArrowLeft,
  FaListUl,
  FaMusic,
  FaCompactDisc,
  FaTrash,
  FaTimes,
} from "react-icons/fa";
import { usePlaylist } from "@/context/PlaylistContext";
import { useAuth } from "@/context/AuthContext";
import { Playlist, PlaylistTrack, PlaylistAlbum } from "@/types/playlist";
import { createSlug } from "@/lib/utils";
import { createClient } from "@/utils/supabase/client";
import Button from "@/components/ui/Button";
import OptimizedImage from "@/components/ui/OptimizedImage";
import TrackItem from "@/components/album/TrackItem";
import MySection from "@/components/ui/MySection";
import { cn } from "@/lib/utils";
import { PAGE_CONTENT_TOP } from "@/lib/pageLayout";

export default function PlaylistPage() {
  const params = useParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { deletePlaylist, removeTrackFromPlaylist, removeAlbumFromPlaylist } =
    usePlaylist();

  const playlistId = params.id as string;

  const [playlist, setPlaylist] = useState<Playlist | null>(null);
  const [tracks, setTracks] = useState<PlaylistTrack[]>([]);
  const [albums, setAlbums] = useState<PlaylistAlbum[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [removingTrack, setRemovingTrack] = useState<string | null>(null);
  const [removingAlbum, setRemovingAlbum] = useState<string | null>(null);

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

  const handleDeletePlaylist = async () => {
    if (!playlist) return;
    if (!confirm("Are you sure you want to delete this playlist?")) return;
    setDeleting(true);
    await deletePlaylist(playlist.id);
    router.push("/profile");
  };

  const handleRemoveTrack = async (trackId: string) => {
    if (!playlist) return;
    setRemovingTrack(trackId);
    await removeTrackFromPlaylist(playlist.id, trackId);
    setTracks((prev) => prev.filter((t) => t.track_id !== trackId));
    setRemovingTrack(null);
  };

  const handleRemoveAlbum = async (albumId: string) => {
    if (!playlist) return;
    setRemovingAlbum(albumId);
    await removeAlbumFromPlaylist(playlist.id, albumId);
    setAlbums((prev) => prev.filter((a) => a.album_id !== albumId));
    setRemovingAlbum(null);
  };

  const formatDuration = (ms?: number | null) => {
    if (!ms) return "";
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

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
              <FaArrowLeft size={12} />
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
      <MySection className={cn(PAGE_CONTENT_TOP, "pb-20")}>
        <div className="w-full max-w-4xl">
          {/* Back link */}
          <Link
            href="/profile"
            className="inline-flex items-center gap-2 text-neutral-500 hover:text-neutral-900 transition-colors text-sm font-mono mb-8"
          >
            <FaArrowLeft size={12} />
            Back to profile
          </Link>

          {/* Playlist Header */}
          <div className="flex items-start gap-5 mb-10">
            <div className="w-20 h-20 flex items-center justify-center bg-white border border-[#dddddd] rounded-md shrink-0">
              {playlist?.type === "albums" ? (
                <FaCompactDisc size={32} className="text-neutral-600" />
              ) : (
                <FaListUl size={32} className="text-neutral-600" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-1">
                <h1 className="text-2xl md:text-3xl font-light tracking-tight text-neutral-900 truncate">
                  {playlist?.name}
                </h1>
                <span className="text-[10px] uppercase tracking-wider text-neutral-600 font-mono bg-neutral-200 px-2 py-0.5 rounded shrink-0">
                  {playlist?.type === "albums" ? "Albums" : "Songs"}
                </span>
              </div>
              {playlist?.description && (
                <p className="text-sm text-neutral-500 mb-2">
                  {playlist.description}
                </p>
              )}
              <div className="flex items-center gap-4 text-xs text-neutral-600 font-mono">
                <span>
                  {playlist?.type === "albums"
                    ? `${albums.length} albums`
                    : `${tracks.length} tracks`}
                </span>
                <span>
                  Created{" "}
                  {playlist
                    ? new Date(playlist.created_at).toLocaleDateString()
                    : ""}
                </span>
              </div>
            </div>
            <Button
              size="sm"
              variant="ghost"
              onClick={handleDeletePlaylist}
              disabled={deleting}
              className="text-neutral-500 hover:text-red-400 shrink-0"
            >
              <FaTrash size={14} />
            </Button>
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
              <div className="space-y-1">
                {albums.map((album, index) => {
                  const albumSlug = album.album_name
                    ? createSlug(album.album_name, album.album_id)
                    : null;
                  const href = albumSlug ? `/album/${albumSlug}` : undefined;

                  const albumContent = (
                    <>
                      <span className="text-xs text-neutral-600 font-mono w-6 text-center shrink-0">
                        {index + 1}
                      </span>
                      <div className="relative w-12 h-12 shrink-0 bg-[#efefef] overflow-hidden rounded-sm">
                        {album.thumbnail_url ? (
                          <OptimizedImage
                            src={album.thumbnail_url}
                            alt={album.album_name || "Unknown"}
                            fill
                            className="object-cover"
                            fallbackSrc="/vinyl-placeholder.svg"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-[#efefef]">
                            <FaCompactDisc
                              size={16}
                              className="text-neutral-600"
                            />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-neutral-900 truncate group-hover:text-black transition-colors">
                          {album.album_name || "Unknown Album"}
                        </p>
                        <p className="text-xs text-neutral-500 truncate">
                          {album.artist_name || "Unknown Artist"}
                          {album.total_tracks &&
                            ` · ${album.total_tracks} tracks`}
                        </p>
                      </div>
                      <Button
                        size="xxs"
                        variant="ghost"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleRemoveAlbum(album.album_id);
                        }}
                        disabled={removingAlbum === album.album_id}
                        className="opacity-0 group-hover:opacity-100 transition-opacity text-neutral-500 hover:text-red-400"
                      >
                        <FaTimes size={10} />
                      </Button>
                    </>
                  );

                  return href ? (
                    <Link
                      key={album.id}
                      href={href}
                      className="group flex items-center gap-3 p-3 bg-white border border-[#e1e1e1] hover:border-[#cbcbcb] hover:bg-[#f8f8f8] rounded-md transition-all duration-200"
                    >
                      {albumContent}
                    </Link>
                  ) : (
                    <div
                      key={album.id}
                      className="group flex items-center gap-3 p-3 bg-white border border-[#e1e1e1] hover:border-[#d0d0d0] rounded-md"
                    >
                      {albumContent}
                    </div>
                  );
                })}
              </div>
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
            <div className="flex flex-col">
              {tracks.map((track, index) => {
                const albumContext = {
                  albumId: track.album_id || "",
                  title: track.album_name || "Unknown Album",
                  artistName: track.artist_name || "Unknown Artist",
                  totalTracks: 0,
                };

                return (
                  <div key={track.id} className="w-full">
                    <TrackItem
                      track={{
                        id: track.track_id,
                        number: String(index + 1),
                        title: track.track_name || "Unknown Track",
                        length: track.duration_ms || 0,
                        artists: track.artist_name
                          ? [{ id: "unknown", name: track.artist_name }]
                          : [],
                        hasLyrics: false,
                      }}
                      artistName={track.artist_name || "Unknown Artist"}
                      artistId="unknown"
                      albumId={track.album_id || ""}
                      albumImageUrl={track.thumbnail_url || ""}
                      albumContext={albumContext}
                      onRemove={() => handleRemoveTrack(track.track_id)}
                      isRemoving={removingTrack === track.track_id}
                    />
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </MySection>
    </main>
  );
}
