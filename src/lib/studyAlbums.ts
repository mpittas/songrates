import { playlistHref, type CollectionCardData } from "@/lib/albumCollections";
import { createSlug } from "@/lib/utils";

export type StudyAlbum = {
  id: string;
  title: string;
  artist: string;
  artworkUrl?: string;
};

export function albumsFromCollection(
  collection: CollectionCardData,
): StudyAlbum[] {
  const length = Math.max(
    collection.coverUrls.length,
    collection.albumNames?.length ?? 0,
    collection.albumIds?.length ?? 0,
  );

  const albums: StudyAlbum[] = [];
  for (let i = 0; i < length; i++) {
    const id = collection.albumIds?.[i];
    const artworkUrl = collection.coverUrls[i] || undefined;
    if (!id && !artworkUrl) continue;

    albums.push({
      id: id || `missing-${i}`,
      title: collection.albumNames?.[i] || "Unknown Album",
      artist: collection.artistNames?.[i] || "Unknown Artist",
      artworkUrl,
    });
  }

  return albums;
}

export function albumPageHref(album: StudyAlbum): string | undefined {
  if (!album.id || album.id.startsWith("missing-")) return undefined;
  return `/album/${createSlug(album.title, album.id)}`;
}

export function crateOpenHref(
  collection: CollectionCardData,
): string | undefined {
  if (collection.isSample) {
    const first = albumsFromCollection(collection)[0];
    return first ? albumPageHref(first) : undefined;
  }
  return playlistHref(collection);
}
