import type { Album, TopSong } from "@/types/music";

export function dedupeAlbumsById(list: Album[]): Album[] {
  const seen = new Set<string>();
  return list.filter((a) => {
    if (seen.has(a.id)) return false;
    seen.add(a.id);
    return true;
  });
}

export function filterTopSongsByQuery(
  list: TopSong[],
  searchQuery: string | undefined,
): TopSong[] {
  if (!searchQuery?.trim()) return list;
  const q = searchQuery.toLowerCase();
  return list.filter(
    (s) =>
      s.name.toLowerCase().includes(q) ||
      (s.albumName && s.albumName.toLowerCase().includes(q)),
  );
}

export function filterAndAnnotateAlbums(
  list: Album[],
  searchQuery: string | undefined,
  getAlbumRating: (albumId: string) => number | null,
): Album[] {
  let result = dedupeAlbumsById(list);
  if (searchQuery?.trim()) {
    const q = searchQuery.toLowerCase();
    result = result.filter((a) => a.title.toLowerCase().includes(q));
  }
  return result.map((a) => ({ ...a, rating: getAlbumRating(a.id) }));
}
