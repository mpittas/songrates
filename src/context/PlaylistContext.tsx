"use client";

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
} from "react";
import { useAuth } from "@/context/AuthContext";
import { createClient } from "@/utils/supabase/client";
import {
  Playlist,
  PlaylistTrack,
  PlaylistAlbum,
  CreatePlaylistInput,
  AddTrackToPlaylistInput,
  AddAlbumToPlaylistInput,
} from "@/types/playlist";

interface PlaylistContextType {
  playlists: Playlist[];
  loading: boolean;
  fetchPlaylists: () => Promise<void>;
  createPlaylist: (input: CreatePlaylistInput) => Promise<Playlist | null>;
  deletePlaylist: (playlistId: string) => Promise<void>;
  addTrackToPlaylist: (input: AddTrackToPlaylistInput) => Promise<boolean>;
  removeTrackFromPlaylist: (
    playlistId: string,
    trackId: string,
  ) => Promise<void>;
  getPlaylistTracks: (
    playlistId: string,
    forceRefresh?: boolean,
  ) => Promise<PlaylistTrack[]>;
  isTrackInPlaylist: (playlistId: string, trackId: string) => boolean;
  addAlbumToPlaylist: (input: AddAlbumToPlaylistInput) => Promise<boolean>;
  removeAlbumFromPlaylist: (
    playlistId: string,
    albumId: string,
  ) => Promise<void>;
  getPlaylistAlbums: (
    playlistId: string,
    forceRefresh?: boolean,
  ) => Promise<PlaylistAlbum[]>;
  isAlbumInPlaylist: (playlistId: string, albumId: string) => boolean;
}

const PlaylistContext = createContext<PlaylistContextType | undefined>(
  undefined,
);

export function PlaylistProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [supabase] = useState(() => createClient());
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(false);
  const [playlistTracksCache, setPlaylistTracksCache] = useState<
    Record<string, PlaylistTrack[]>
  >({});
  const [playlistAlbumsCache, setPlaylistAlbumsCache] = useState<
    Record<string, PlaylistAlbum[]>
  >({});

  // Fetch user's playlists
  const fetchPlaylists = useCallback(async () => {
    if (!user) {
      setPlaylists([]);
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("playlists")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching playlists:", error);
        return;
      }

      setPlaylists(data || []);
    } finally {
      setLoading(false);
    }
  }, [user, supabase]);

  // Fetch playlists on mount and when user changes
  useEffect(() => {
    fetchPlaylists();
  }, [fetchPlaylists]);

  // Create a new playlist
  const createPlaylist = useCallback(
    async (input: CreatePlaylistInput): Promise<Playlist | null> => {
      if (!user) return null;

      try {
        const { data, error } = await supabase
          .from("playlists")
          .insert({
            user_id: user.id,
            name: input.name,
            description: input.description || null,
            type: input.type || "songs",
          })
          .select()
          .single();

        if (error) {
          console.error("Error creating playlist:", error);
          return null;
        }

        const newPlaylist = data as Playlist;
        setPlaylists((prev) => [newPlaylist, ...prev]);
        return newPlaylist;
      } catch (err) {
        console.error("Error creating playlist:", err);
        return null;
      }
    },
    [user, supabase],
  );

  // Delete a playlist
  const deletePlaylist = useCallback(
    async (playlistId: string) => {
      if (!user) return;

      try {
        const { error } = await supabase
          .from("playlists")
          .delete()
          .eq("id", playlistId)
          .eq("user_id", user.id);

        if (error) {
          console.error("Error deleting playlist:", error);
          return;
        }

        setPlaylists((prev) => prev.filter((p) => p.id !== playlistId));
        // Clear cache for deleted playlist
        setPlaylistTracksCache((prev) => {
          const next = { ...prev };
          delete next[playlistId];
          return next;
        });
        setPlaylistAlbumsCache((prev) => {
          const next = { ...prev };
          delete next[playlistId];
          return next;
        });
      } catch (err) {
        console.error("Error deleting playlist:", err);
      }
    },
    [user, supabase],
  );

  // Add a track to a playlist
  const addTrackToPlaylist = useCallback(
    async (input: AddTrackToPlaylistInput): Promise<boolean> => {
      if (!user) return false;

      try {
        // First, get the current max position
        const { data: existingTracks, error: fetchError } = await supabase
          .from("playlist_tracks")
          .select("position")
          .eq("playlist_id", input.playlistId)
          .order("position", { ascending: false })
          .limit(1);

        if (fetchError) {
          console.error("Error fetching existing tracks:", fetchError);
          return false;
        }

        const nextPosition =
          existingTracks && existingTracks.length > 0
            ? existingTracks[0].position + 1
            : 0;

        const { error } = await supabase.from("playlist_tracks").insert({
          playlist_id: input.playlistId,
          track_id: input.trackId,
          position: nextPosition,
          track_name: input.trackName || null,
          artist_name: input.artistName || null,
          album_name: input.albumName || null,
          album_id: input.albumId || null,
          thumbnail_url: input.thumbnailUrl || null,
          duration_ms: input.durationMs || null,
        });

        if (error) {
          // Check if it's a unique constraint violation (track already in playlist)
          if (error.code === "23505") {
            console.log("Track already in playlist");
            return false;
          }
          console.error("Error adding track to playlist:", error);
          return false;
        }

        // Update cache if we have it
        setPlaylistTracksCache((prev) => {
          const cached = prev[input.playlistId];
          if (cached) {
            return {
              ...prev,
              [input.playlistId]: [
                ...cached,
                {
                  id: crypto.randomUUID(),
                  playlist_id: input.playlistId,
                  track_id: input.trackId,
                  position: nextPosition,
                  track_name: input.trackName || null,
                  artist_name: input.artistName || null,
                  album_name: input.albumName || null,
                  album_id: input.albumId || null,
                  thumbnail_url: input.thumbnailUrl || null,
                  duration_ms: input.durationMs || null,
                  added_at: new Date().toISOString(),
                },
              ],
            };
          }
          return prev;
        });

        return true;
      } catch (err) {
        console.error("Error adding track to playlist:", err);
        return false;
      }
    },
    [user, supabase],
  );

  // Remove a track from a playlist
  const removeTrackFromPlaylist = useCallback(
    async (playlistId: string, trackId: string) => {
      if (!user) return;

      try {
        const { error } = await supabase
          .from("playlist_tracks")
          .delete()
          .eq("playlist_id", playlistId)
          .eq("track_id", trackId);

        if (error) {
          console.error("Error removing track from playlist:", error);
          return;
        }

        // Update cache
        setPlaylistTracksCache((prev) => {
          const cached = prev[playlistId];
          if (cached) {
            return {
              ...prev,
              [playlistId]: cached.filter((t) => t.track_id !== trackId),
            };
          }
          return prev;
        });
      } catch (err) {
        console.error("Error removing track from playlist:", err);
      }
    },
    [user, supabase],
  );

  // Get tracks for a specific playlist
  const getPlaylistTracks = useCallback(
    async (
      playlistId: string,
      forceRefresh = false,
    ): Promise<PlaylistTrack[]> => {
      if (!user) return [];

      // Check cache first
      if (!forceRefresh && playlistTracksCache[playlistId]) {
        return playlistTracksCache[playlistId];
      }

      try {
        const { data, error } = await supabase
          .from("playlist_tracks")
          .select("*")
          .eq("playlist_id", playlistId)
          .order("position", { ascending: true });

        if (error) {
          console.error("Error fetching playlist tracks:", error);
          return [];
        }

        const tracks = data || [];
        setPlaylistTracksCache((prev) => ({
          ...prev,
          [playlistId]: tracks,
        }));
        return tracks;
      } catch (err) {
        console.error("Error fetching playlist tracks:", err);
        return [];
      }
    },
    [user, supabase, playlistTracksCache],
  );

  // Check if a track is in a playlist
  const isTrackInPlaylist = useCallback(
    (playlistId: string, trackId: string): boolean => {
      const cached = playlistTracksCache[playlistId];
      if (!cached) return false;
      return cached.some((t) => t.track_id === trackId);
    },
    [playlistTracksCache],
  );

  // Add an album to a playlist
  const addAlbumToPlaylist = useCallback(
    async (input: AddAlbumToPlaylistInput): Promise<boolean> => {
      if (!user) return false;

      try {
        const { data: existing, error: fetchError } = await supabase
          .from("playlist_albums")
          .select("position")
          .eq("playlist_id", input.playlistId)
          .order("position", { ascending: false })
          .limit(1);

        if (fetchError) {
          console.error("Error fetching existing albums:", fetchError);
          return false;
        }

        const nextPosition =
          existing && existing.length > 0 ? existing[0].position + 1 : 0;

        const { error } = await supabase.from("playlist_albums").insert({
          playlist_id: input.playlistId,
          album_id: input.albumId,
          position: nextPosition,
          album_name: input.albumName || null,
          artist_name: input.artistName || null,
          thumbnail_url: input.thumbnailUrl || null,
          release_date: input.releaseDate || null,
          total_tracks: input.totalTracks || null,
        });

        if (error) {
          if (error.code === "23505") {
            console.log("Album already in playlist");
            return false;
          }
          console.error("Error adding album to playlist:", error);
          return false;
        }

        setPlaylistAlbumsCache((prev) => {
          const cached = prev[input.playlistId];
          if (cached) {
            return {
              ...prev,
              [input.playlistId]: [
                ...cached,
                {
                  id: crypto.randomUUID(),
                  playlist_id: input.playlistId,
                  album_id: input.albumId,
                  position: nextPosition,
                  album_name: input.albumName || null,
                  artist_name: input.artistName || null,
                  thumbnail_url: input.thumbnailUrl || null,
                  release_date: input.releaseDate || null,
                  total_tracks: input.totalTracks || null,
                  added_at: new Date().toISOString(),
                },
              ],
            };
          }
          return prev;
        });

        return true;
      } catch (err) {
        console.error("Error adding album to playlist:", err);
        return false;
      }
    },
    [user, supabase],
  );

  // Remove an album from a playlist
  const removeAlbumFromPlaylist = useCallback(
    async (playlistId: string, albumId: string) => {
      if (!user) return;

      try {
        const { error } = await supabase
          .from("playlist_albums")
          .delete()
          .eq("playlist_id", playlistId)
          .eq("album_id", albumId);

        if (error) {
          console.error("Error removing album from playlist:", error);
          return;
        }

        setPlaylistAlbumsCache((prev) => {
          const cached = prev[playlistId];
          if (cached) {
            return {
              ...prev,
              [playlistId]: cached.filter((a) => a.album_id !== albumId),
            };
          }
          return prev;
        });
      } catch (err) {
        console.error("Error removing album from playlist:", err);
      }
    },
    [user, supabase],
  );

  // Get albums for a specific playlist
  const getPlaylistAlbums = useCallback(
    async (
      playlistId: string,
      forceRefresh = false,
    ): Promise<PlaylistAlbum[]> => {
      if (!user) return [];

      if (!forceRefresh && playlistAlbumsCache[playlistId]) {
        return playlistAlbumsCache[playlistId];
      }

      try {
        const { data, error } = await supabase
          .from("playlist_albums")
          .select("*")
          .eq("playlist_id", playlistId)
          .order("position", { ascending: true });

        if (error) {
          console.error("Error fetching playlist albums:", error);
          return [];
        }

        const albums = data || [];
        setPlaylistAlbumsCache((prev) => ({
          ...prev,
          [playlistId]: albums,
        }));
        return albums;
      } catch (err) {
        console.error("Error fetching playlist albums:", err);
        return [];
      }
    },
    [user, supabase, playlistAlbumsCache],
  );

  // Check if an album is in a playlist
  const isAlbumInPlaylist = useCallback(
    (playlistId: string, albumId: string): boolean => {
      const cached = playlistAlbumsCache[playlistId];
      if (!cached) return false;
      return cached.some((a) => a.album_id === albumId);
    },
    [playlistAlbumsCache],
  );

  return (
    <PlaylistContext.Provider
      value={{
        playlists,
        loading,
        fetchPlaylists,
        createPlaylist,
        deletePlaylist,
        addTrackToPlaylist,
        removeTrackFromPlaylist,
        getPlaylistTracks,
        isTrackInPlaylist,
        addAlbumToPlaylist,
        removeAlbumFromPlaylist,
        getPlaylistAlbums,
        isAlbumInPlaylist,
      }}
    >
      {children}
    </PlaylistContext.Provider>
  );
}

export function usePlaylist() {
  const context = useContext(PlaylistContext);
  if (context === undefined) {
    throw new Error("usePlaylist must be used within a PlaylistProvider");
  }
  return context;
}
