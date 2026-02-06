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
  /** MusicBrainz recording ID (may be empty string) */
  mbid: string;
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

    return tracks.map((t: any) => ({
      name: t.name || "",
      artist: t.artist || "",
      listeners: parseInt(t.listeners, 10) || 0,
      mbid: t.mbid || "",
    }));
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

/**
 * Fetches top tracks for an artist to map listener counts to album tracks.
 * Returns a map of normalized track title -> listener count.
 */
export async function getArtistTrackPopularity(
  artistName: string,
): Promise<Record<string, number>> {
  const apiKey = process.env.LASTFM_API_KEY;
  if (!apiKey || !artistName) return {};

  try {
    const url = `${LASTFM_BASE_URL}?method=artist.gettoptracks&artist=${encodeURIComponent(
      artistName,
    )}&api_key=${apiKey}&format=json&limit=500`; // Fetch top 500 to cover full discography

    const res = await fetch(url, { next: { revalidate: 3600 } }); // 1 hour cache
    const data = await res.json();

    if (!data.toptracks || !data.toptracks.track) {
      return {};
    }

    const tracks = Array.isArray(data.toptracks.track)
      ? data.toptracks.track
      : [data.toptracks.track];

    const popularityMap: Record<string, number> = {};

    tracks.forEach((t: any) => {
      if (t.name && t.listeners) {
        // Normalize: lowercase, standard spaces.
        // We use this key to match against album track titles.
        const key = t.name.toLowerCase().trim();
        popularityMap[key] = parseInt(t.listeners, 10);
      }
    });

    return popularityMap;
  } catch (error) {
    console.error("Error fetching Last.fm track popularity:", error);
    return {};
  }
}
