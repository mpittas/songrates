import { artworkUrl, type BrowsePill } from "@/lib/appleMusic/api";

/** Pick a few distinct playlist covers for a hero strip. */
export function pickHeroArtworks(pills: BrowsePill[], count = 4): string[] {
  const seen = new Set<string>();
  const out: string[] = [];

  for (const pill of pills) {
    for (const playlist of pill.playlists) {
      if (playlist.artworkUrl && !seen.has(playlist.id)) {
        seen.add(playlist.id);
        out.push(artworkUrl(playlist.artworkUrl, 300));
        if (out.length >= count) return out;
      }
    }
  }

  return out;
}

export function countPlaylists(pills: BrowsePill[]): number {
  return pills.reduce((sum, pill) => sum + pill.playlists.length, 0);
}
