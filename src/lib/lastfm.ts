const LASTFM_BASE_URL = "http://ws.audioscrobbler.com/2.0/";

interface PopularityResponse {
  [titleKey: string]: number;
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
