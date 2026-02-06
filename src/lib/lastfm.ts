const LASTFM_BASE_URL = "http://ws.audioscrobbler.com/2.0/";

interface PopularityResponse {
  [titleKey: string]: number;
}

// ─── Last.fm Track Search Result ───────────────────────────────────────────────

export interface LastFmTrack {
  name: string;
  artist: string;
  /** Last.fm listener count — the real popularity signal */
  listeners: number;
  /** Last.fm total play count — actual total listens */
  playcount?: number;
  /** MusicBrainz recording ID (may be empty string) */
  mbid: string;
}

/**
 * Fetch playcounts for a limited number of tracks using track.getInfo.
 * Only called for top results to avoid slowing down search.
 */
async function fetchTrackPlaycounts(
  tracks: { name: string; artist: string }[],
): Promise<Map<string, number>> {
  const apiKey = process.env.LASTFM_API_KEY;
  if (!apiKey || tracks.length === 0) return new Map();

  const playcounts = new Map<string, number>();

  // Limit to top 10 tracks to avoid API rate limits
  const limitedTracks = tracks.slice(0, 10);

  // Fetch in parallel with a small delay between batches
  const batchSize = 5;
  for (let i = 0; i < limitedTracks.length; i += batchSize) {
    const batch = limitedTracks.slice(i, i + batchSize);

    const promises = batch.map(async (track) => {
      try {
        const url = `${LASTFM_BASE_URL}?method=track.getInfo&artist=${encodeURIComponent(
          track.artist,
        )}&track=${encodeURIComponent(track.name)}&api_key=${apiKey}&format=json`;

        const res = await fetch(url, { next: { revalidate: 1800 } });
        if (!res.ok) return;

        const data = await res.json();
        const playcount = parseInt(data?.track?.playcount, 10);
        if (playcount > 0) {
          const key = `${track.artist}:${track.name}`;
          playcounts.set(key, playcount);
        }
      } catch (err) {
        // Silently fail - playcount is optional enrichment
      }
    });

    await Promise.all(promises);

    // Small delay between batches to be respectful to the API
    if (i + batchSize < limitedTracks.length) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }

  return playcounts;
}

/**
 * Search Last.fm for tracks. Returns results sorted by popularity (listener count).
 * This is the key to surfacing famous songs like "Billie Jean" by MJ over covers.
 *
 * @param query   Search query (e.g., "Billie Jean")
 * @param limit   Max results to return (default 30)
 * @returns       Array of LastFmTrack sorted by listener count (descending)
 */
export async function searchLastFmTracks(
  query: string,
  limit: number = 30,
): Promise<LastFmTrack[]> {
  const apiKey = process.env.LASTFM_API_KEY;
  if (!apiKey) return [];

  try {
    const url = `${LASTFM_BASE_URL}?method=track.search&track=${encodeURIComponent(
      query,
    )}&api_key=${apiKey}&format=json&limit=${limit}`;

    const res = await fetch(url, { next: { revalidate: 1800 } });
    if (!res.ok) return [];

    const data = await res.json();
    const tracks = data?.results?.trackmatches?.track;
    if (!Array.isArray(tracks)) return [];

    const results = tracks.map((t: any) => ({
      name: t.name || "",
      artist: t.artist || "",
      listeners: parseInt(t.listeners, 10) || 0,
      mbid: t.mbid || "",
    }));

    // Fetch playcounts for top results only (to avoid slowing down search)
    const playcounts = await fetchTrackPlaycounts(results.slice(0, 10));

    // Merge playcounts back into results
    return results.map((track) => {
      const key = `${track.artist}:${track.name}`;
      return {
        ...track,
        playcount: playcounts.get(key),
      };
    });
  } catch (err) {
    console.error("Last.fm track search error:", err);
    return [];
  }
}

export async function getArtistPopularity(
  artistName: string,
): Promise<PopularityResponse> {
  const apiKey = process.env.LASTFM_API_KEY;
  if (!apiKey) {
    console.error(
      "Missing LASTFM_API_KEY environment variable. Popularity sorting will not work.",
    );
    return {};
  }

  if (!artistName) return {};

  try {
    // Limit 500 to get a good coverage of discography.
    // We use artist name because MBID support in Last.fm can be spotty.
    const url = `${LASTFM_BASE_URL}?method=artist.gettopalbums&artist=${encodeURIComponent(
      artistName,
    )}&api_key=${apiKey}&format=json&limit=500`;

    const res = await fetch(url, { next: { revalidate: 86400 } });
    const data = await res.json();

    if (!data.topalbums || !data.topalbums.album) {
      console.warn("Last.fm: No albums found for", artistName);
      return {};
    }

    const popularityMap: PopularityResponse = {};
    const albums = Array.isArray(data.topalbums.album)
      ? data.topalbums.album
      : [data.topalbums.album];

    albums.forEach((album: any) => {
      if (album.name && album.playcount) {
        const key = album.name.toLowerCase().trim();
        const playcount = parseInt(album.playcount, 10);

        if (!popularityMap[key] || playcount > popularityMap[key]) {
          popularityMap[key] = playcount;
        }
      }
    });

    return popularityMap;
  } catch (error) {
    console.error("Error fetching Last.fm popularity:", error);
    return {};
  }
}
