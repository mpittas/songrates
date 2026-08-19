import { createSlug } from "@/lib/utils";
import type { Track } from "@/types/music";
import type { PlaybackSource } from "@/types/player";

export function albumPlaybackSource(
  id: string,
  title: string,
): PlaybackSource {
  return { type: "album", id, title, href: `/album/${id}` };
}

export function playlistPlaybackSource(
  id: string,
  title: string,
): PlaybackSource {
  return { type: "playlist", id, title, href: `/playlist/${id}` };
}

export function applePlaylistPlaybackSource(
  id: string,
  title: string,
): PlaybackSource {
  return {
    type: "apple-playlist",
    id,
    title,
    href: `/apple-playlist/${id}`,
  };
}

export function artistPlaybackSource(
  id: string,
  title: string,
): PlaybackSource {
  return {
    type: "artist",
    id,
    title,
    href: `/artist/${createSlug(title, id)}`,
  };
}

export function inferPlaybackSource(track: Track): PlaybackSource | undefined {
  if (!track.albumId) return undefined;
  return albumPlaybackSource(track.albumId, track.albumTitle || "Album");
}

export function playbackSourceKindLabel(source: PlaybackSource): string {
  switch (source.type) {
    case "album":
      return "Album";
    case "playlist":
    case "apple-playlist":
      return "Playlist";
    case "artist":
      return "Artist";
  }
}

export function isSamePlaybackSource(
  a: PlaybackSource | null | undefined,
  b: PlaybackSource | null | undefined,
): boolean {
  if (!a || !b) return false;
  return a.type === b.type && a.id === b.id;
}
