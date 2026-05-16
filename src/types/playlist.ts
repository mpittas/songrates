export type PlaylistType = "songs" | "albums";

export interface Playlist {
  id: string;
  user_id: string;
  name: string;
  type: PlaylistType;
  created_at: string;
  updated_at: string;
}

export interface PlaylistTrack {
  id: string;
  playlist_id: string;
  track_id: string;
  position: number;
  track_name: string | null;
  artist_name: string | null;
  album_name: string | null;
  album_id: string | null;
  thumbnail_url: string | null;
  duration_ms: number | null;
  added_at: string;
}

export interface PlaylistWithTracks extends Playlist {
  tracks: PlaylistTrack[];
  trackCount: number;
}

export interface PlaylistAlbum {
  id: string;
  playlist_id: string;
  album_id: string;
  position: number;
  album_name: string | null;
  artist_name: string | null;
  thumbnail_url: string | null;
  release_date: string | null;
  total_tracks: number | null;
  added_at: string;
}

export interface CreatePlaylistInput {
  name: string;
  type?: PlaylistType;
}

export interface AddTrackToPlaylistInput {
  playlistId: string;
  trackId: string;
  trackName?: string;
  artistName?: string;
  albumName?: string;
  albumId?: string;
  thumbnailUrl?: string;
  durationMs?: number;
}

export interface RemoveTrackFromPlaylistInput {
  playlistId: string;
  trackId: string;
}

export interface AddAlbumToPlaylistInput {
  playlistId: string;
  albumId: string;
  albumName?: string;
  artistName?: string;
  thumbnailUrl?: string;
  releaseDate?: string;
  totalTracks?: number;
}

export interface RemoveAlbumFromPlaylistInput {
  playlistId: string;
  albumId: string;
}
