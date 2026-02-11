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
      <main className="min-h-screen bg-[#050507] flex items-center justify-center">
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
      <main className="min-h-screen bg-[#050507]">
        <div className="max-w-4xl mx-auto px-6 pt-20">
          <Link
            href="/profile"
            className="inline-flex items-center gap-2 text-neutral-500 hover:text-[#00f0ff] transition-colors text-sm font-mono mb-8"
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
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#050507]">
      <div className="max-w-4xl mx-auto px-6 pt-20 pb-20">
        {/* Back link */}
        <Link
          href="/profile"
          className="inline-flex items-center gap-2 text-neutral-500 hover:text-[#00f0ff] transition-colors text-sm font-mono mb-8"
        >
          <FaArrowLeft size={12} />
          Back to profile
        </Link>

        {/* Playlist Header */}
        <div className="flex items-start gap-5 mb-10">
          <div className="w-20 h-20 flex items-center justify-center bg-neutral-900 border border-white/[0.06] rounded-sm shrink-0">
            {playlist?.type === "albums" ? (
              <FaCompactDisc size={32} className="text-neutral-600" />
            ) : (
              <FaListUl size={32} className="text-neutral-600" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-2xl md:text-3xl font-light tracking-tight text-white truncate">
                {playlist?.name}
              </h1>
              <span className="text-[10px] uppercase tracking-wider text-neutral-600 font-mono bg-neutral-800 px-2 py-0.5 rounded shrink-0">
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
            <div className="py-16 text-center border border-white/[0.04] bg-neutral-900/20">
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
                    <div className="relative w-12 h-12 shrink-0 bg-neutral-800 overflow-hidden rounded-sm">
                      {album.thumbnail_url ? (
                        <OptimizedImage
                          src={album.thumbnail_url}
                          alt={album.album_name || "Unknown"}
                          fill
                          className="object-cover"
                          fallbackSrc="/vinyl-placeholder.svg"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-neutral-800/80">
                          <FaCompactDisc
                            size={16}
                            className="text-neutral-600"
                          />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white truncate group-hover:text-[#00f0ff] transition-colors">
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
                    className="group flex items-center gap-3 p-3 bg-neutral-900/30 border border-white/[0.04] hover:border-[#00f0ff]/20 hover:bg-neutral-900/50 rounded-sm transition-all duration-200"
                  >
                    {albumContent}
                  </Link>
                ) : (
                  <div
                    key={album.id}
                    className="group flex items-center gap-3 p-3 bg-neutral-900/30 border border-white/[0.04] hover:border-white/[0.08] rounded-sm"
                  >
                    {albumContent}
                  </div>
                );
              })}
            </div>
          )
        ) : /* Song Playlist Content */
        tracks.length === 0 ? (
          <div className="py-16 text-center border border-white/[0.04] bg-neutral-900/20">
            <FaMusic size={32} className="text-neutral-700 mx-auto mb-4" />
            <p className="text-neutral-600 font-mono text-sm">
              No tracks in this playlist
            </p>
            <p className="text-neutral-700 text-xs mt-1">
              Add tracks from album pages
            </p>
          </div>
        ) : (
          <div className="space-y-1">
            {tracks.map((track, index) => {
              const albumSlug =
                track.album_id && track.album_name
                  ? createSlug(track.album_name, track.album_id)
                  : null;
              const href = albumSlug
                ? `/album/${albumSlug}?track=${track.track_id}`
                : undefined;

              const trackContent = (
                <>
                  <span className="text-xs text-neutral-600 font-mono w-6 text-center shrink-0">
                    {index + 1}
                  </span>
                  <div className="relative w-12 h-12 shrink-0 bg-neutral-800 overflow-hidden rounded-sm">
                    {track.thumbnail_url ? (
                      <OptimizedImage
                        src={track.thumbnail_url}
                        alt={track.track_name || "Unknown"}
                        fill
                        className="object-cover"
                        fallbackSrc="/vinyl-placeholder.svg"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-neutral-800/80">
                        <FaMusic size={16} className="text-neutral-600" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white truncate group-hover:text-[#00f0ff] transition-colors">
                      {track.track_name || "Unknown Track"}
                    </p>
                    <p className="text-xs text-neutral-500 truncate">
                      {track.artist_name || "Unknown Artist"}
                      {track.album_name && ` · ${track.album_name}`}
                    </p>
                  </div>
                  <span className="text-xs text-neutral-600 font-mono shrink-0">
                    {formatDuration(track.duration_ms)}
                  </span>
                  <Button
                    size="xxs"
                    variant="ghost"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleRemoveTrack(track.track_id);
                    }}
                    disabled={removingTrack === track.track_id}
                    className="opacity-0 group-hover:opacity-100 transition-opacity text-neutral-500 hover:text-red-400"
                  >
                    <FaTimes size={10} />
                  </Button>
                </>
              );

              return href ? (
                <Link
                  key={track.id}
                  href={href}
                  className="group flex items-center gap-3 p-3 bg-neutral-900/30 border border-white/[0.04] hover:border-[#00f0ff]/20 hover:bg-neutral-900/50 rounded-sm transition-all duration-200"
                >
                  {trackContent}
                </Link>
              ) : (
                <div
                  key={track.id}
                  className="group flex items-center gap-3 p-3 bg-neutral-900/30 border border-white/[0.04] hover:border-white/[0.08] rounded-sm"
                >
                  {trackContent}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
