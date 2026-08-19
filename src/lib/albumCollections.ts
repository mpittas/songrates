import type { SupabaseClient } from "@supabase/supabase-js";

import type { AppleSongResult } from "@/lib/appleMusic/types";
import type { Playlist } from "@/types/playlist";

export interface CollectionCardData {
  id: string;
  name: string;
  itemCount: number;
  coverUrls: (string | undefined)[];
  albumNames?: string[];
  artistNames?: string[];
  albumIds?: string[];
  updatedAt?: string;
  isSample?: boolean;
}

type PlaylistRow = Playlist & {
  playlist_albums?: { count: number }[];
};

type AlbumPreviewRow = {
  playlist_id: string;
  thumbnail_url: string | null;
  position: number;
  album_name: string | null;
  artist_name: string | null;
  album_id: string | null;
};

type PreviewBucket = {
  urls: string[];
  names: string[];
  artists: string[];
  ids: string[];
};

export function playlistHref(collection: CollectionCardData): string | undefined {
  if (collection.isSample) {
    const albumId = collection.albumIds?.find(Boolean);
    return albumId ? `/album/${albumId}` : undefined;
  }
  return `/playlist/${collection.id}`;
}

export async function fetchAlbumCollections(
  supabase: SupabaseClient,
  userId: string,
  previewCount = 3,
): Promise<CollectionCardData[]> {
  const { data: playlistData, error: playlistError } = await supabase
    .from("playlists")
    .select(
      "id, user_id, name, type, created_at, updated_at, playlist_albums(count)",
    )
    .eq("user_id", userId)
    .eq("type", "albums")
    .order("created_at", { ascending: false });

  if (playlistError || !playlistData) return [];

  const albumPlaylists = (playlistData as PlaylistRow[]).map((p) => {
    const albumsCount =
      Array.isArray(p.playlist_albums) && p.playlist_albums[0]?.count != null
        ? Number(p.playlist_albums[0].count)
        : 0;

    return {
      id: p.id,
      user_id: p.user_id,
      name: p.name,
      type: p.type,
      created_at: p.created_at,
      updated_at: p.updated_at,
      itemCount: albumsCount,
    };
  });

  const playlistIds = albumPlaylists.map((p) => p.id);
  const previewsByPlaylist = new Map<string, PreviewBucket>();

  if (playlistIds.length > 0) {
    const { data: previewData } = await supabase
      .from("playlist_albums")
      .select(
        "playlist_id, thumbnail_url, position, album_name, artist_name, album_id",
      )
      .in("playlist_id", playlistIds)
      .order("position", { ascending: true });

    for (const row of (previewData || []) as AlbumPreviewRow[]) {
      const existing = previewsByPlaylist.get(row.playlist_id) ?? {
        urls: [],
        names: [],
        artists: [],
        ids: [],
      };
      if (existing.urls.length >= previewCount) continue;

      existing.urls.push(row.thumbnail_url || "");
      existing.names.push(row.album_name || "Unknown Album");
      existing.artists.push(row.artist_name || "");
      existing.ids.push(row.album_id || "");
      previewsByPlaylist.set(row.playlist_id, existing);
    }
  }

  return albumPlaylists.map((p) => {
    const previews = previewsByPlaylist.get(p.id);
    return {
      id: p.id,
      name: p.name,
      itemCount: p.itemCount,
      coverUrls: previews?.urls ?? [],
      albumNames: previews?.names ?? [],
      artistNames: previews?.artists ?? [],
      albumIds: previews?.ids ?? [],
      updatedAt: p.updated_at,
    };
  });
}

const SAMPLE_NAMES = [
  "Late night crates",
  "Heavy rotation",
  "Sunday stack",
  "New arrivals",
] as const;

export function collectionsFromTrending(
  songs: AppleSongResult[],
): CollectionCardData[] {
  const seen = new Set<string>();
  const albums: {
    id: string;
    name: string;
    artist: string;
    art: string;
  }[] = [];

  for (const song of songs) {
    const id = song.albumId || song.id;
    if (!song.artworkUrl || seen.has(id)) continue;
    seen.add(id);
    albums.push({
      id,
      name: song.albumName || song.name,
      artist: song.artistName,
      art: song.artworkUrl,
    });
  }

  const size = Math.max(4, Math.ceil(albums.length / SAMPLE_NAMES.length));

  return SAMPLE_NAMES.map((name, index) => {
    const slice = albums.slice(index * size, index * size + size);
    return {
      id: `sample-${index}`,
      name,
      itemCount: slice.length,
      coverUrls: slice.map((album) => album.art),
      albumNames: slice.map((album) => album.name),
      artistNames: slice.map((album) => album.artist),
      albumIds: slice.map((album) => album.id),
      updatedAt: new Date().toISOString(),
      isSample: true,
    };
  }).filter((collection) => collection.itemCount > 0);
}
