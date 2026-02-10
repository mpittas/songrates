export interface Playlist {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
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

export interface CreatePlaylistInput {
  name: string;
  description?: string;
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
