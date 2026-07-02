import { notFound, redirect } from "next/navigation";

import { createClient } from "@/utils/supabase/server";
import type { Playlist, PlaylistAlbum, PlaylistTrack } from "@/types/playlist";
import PlaylistPageClient from "./PlaylistPageClient";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function PlaylistPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: playlistData, error: playlistError } = await supabase
    .from("playlists")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (playlistError || !playlistData) {
    notFound();
  }

  const playlist = playlistData as Playlist;

  const [{ data: albumData }, { data: trackData }] = await Promise.all([
    playlist.type === "albums"
      ? supabase
          .from("playlist_albums")
          .select("*")
          .eq("playlist_id", id)
          .order("position", { ascending: true })
      : Promise.resolve({ data: [] }),
    playlist.type === "songs"
      ? supabase
          .from("playlist_tracks")
          .select("*")
          .eq("playlist_id", id)
          .order("position", { ascending: true })
      : Promise.resolve({ data: [] }),
  ]);

  return (
    <PlaylistPageClient
      initialPlaylist={playlist}
      initialAlbums={(albumData || []) as PlaylistAlbum[]}
      initialTracks={(trackData || []) as PlaylistTrack[]}
    />
  );
}
