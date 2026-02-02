const LASTFM_API_KEY = "b25b959554ed76058ac220b7b2e0a026"; // Common public key for testing
const LASTFM_BASE_URL = "http://ws.audioscrobbler.com/2.0/";

export interface PopularityResponse {
  [titleKey: string]: number;
}

/**
 * Fetches album popularity (playcount) for an artist from Last.fm.
 * Returns a map of Lowercase Album Title -> Playcount.
 */
export async function getArtistPopularity(
  artistName: string,
): Promise<PopularityResponse> {
  if (!artistName) return {};

  try {
    // Fetch top albums. Limit 1000 to get a good coverage of discography.
    // We use artist name because MBID support in Last.fm can be spotty.
    const url = `${LASTFM_BASE_URL}?method=artist.gettopalbums&artist=${encodeURIComponent(
      artistName,
    )}&api_key=${LASTFM_API_KEY}&format=json&limit=500`;

    const res = await fetch(url);
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

        // Use the highest playcount found for a title (handling duplicates)
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
