/** Matches Apple enrich chunk size in enrichments.ts — keeps POST bodies small. */
export const PLAYLIST_ENRICH_CHUNK_SIZE = 60;

export type PlaylistSongEnrichment = {
  artists?: { id: string; name: string }[];
  artistId?: string;
  albumId?: string;
};

export async function fetchPlaylistEnrichments(
  songIds: string[],
  signal?: AbortSignal,
): Promise<Record<string, PlaylistSongEnrichment>> {
  const uniqueIds = Array.from(new Set(songIds.filter(Boolean))).sort();
  if (uniqueIds.length === 0) return {};

  const merged: Record<string, PlaylistSongEnrichment> = {};

  for (let i = 0; i < uniqueIds.length; i += PLAYLIST_ENRICH_CHUNK_SIZE) {
    const chunk = uniqueIds.slice(i, i + PLAYLIST_ENRICH_CHUNK_SIZE);
    const res = await fetch("/api/apple-playlist-enrich", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: chunk }),
      signal,
    });
    if (!res.ok) continue;

    const data = (await res.json()) as {
      enrichments?: Record<string, PlaylistSongEnrichment>;
    };
    if (data.enrichments) {
      Object.assign(merged, data.enrichments);
    }
  }

  return merged;
}
