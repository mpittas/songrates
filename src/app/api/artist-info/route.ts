import { NextRequest, NextResponse } from "next/server";

const MB_USER_AGENT = "SongRates/1.0 (mpittas@gmail.com)";
const MB_BASE_URL = "https://musicbrainz.org/ws/2";

interface ArtistInfo {
  image: string | null;
  description: string | null;
  wikipedia: string | null;
  twitter: string | null;
  instagram: string | null;
  facebook: string | null;
  youtube: string | null;
  spotify: string | null;
  officialSite: string | null;
  genres: string[];
  beginDate: string | null;
  endDate: string | null;
  country: string | null;
}

// Fetch URL relations from MusicBrainz - Now also fetches basic artist data
async function fetchMBData(artistId: string): Promise<{
  officialSite: string | null;
  name?: string;
  country?: string;
  lifeSpan?: any;
}> {
  const url = `${MB_BASE_URL}/artist/${artistId}?inc=url-rels&fmt=json`;

  try {
    const res = await fetch(url, {
      headers: { "User-Agent": MB_USER_AGENT, Accept: "application/json" },
      next: { revalidate: 86400 },
    });

    if (!res.ok) return { officialSite: null };

    const data = await res.json();
    const relations = data.relations || [];

    // Find official homepage
    const officialHomepage = relations.find(
      (rel: any) => rel.type === "official homepage" && rel.url?.resource,
    );

    return {
      officialSite: officialHomepage?.url?.resource || null,
      name: data.name,
      country: data.country,
      lifeSpan: data["life-span"],
    };
  } catch {
    return { officialSite: null };
  }
}

// Fetch artist info from Wikidata using MusicBrainz ID
async function fetchWikidataInfo(
  artistId: string,
): Promise<Partial<ArtistInfo>> {
  const query = `
    SELECT ?image ?artistDescription ?wikipediaLink ?twitter ?instagram ?facebook ?youtube ?spotify WHERE {
      ?item wdt:P434 "${artistId}" .
      
      OPTIONAL { ?item wdt:P18 ?image . }
      OPTIONAL { ?item wdt:P2002 ?twitter . }
      OPTIONAL { ?item wdt:P2003 ?instagram . }
      OPTIONAL { ?item wdt:P2013 ?facebook . }
      OPTIONAL { ?item wdt:P2397 ?youtube . }
      OPTIONAL { ?item wdt:P1902 ?spotify . }
      
      OPTIONAL {
        ?wikipediaLink schema:about ?item ;
                       schema:isPartOf <https://en.wikipedia.org/> .
      }
      
      SERVICE wikibase:label {
        bd:serviceParam wikibase:language "en" .
        ?item schema:description ?artistDescription .
      }
    }
    LIMIT 1
  `;

  const url = `https://query.wikidata.org/sparql?query=${encodeURIComponent(query)}&format=json`;

  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": MB_USER_AGENT,
        Accept: "application/json",
      },
      next: { revalidate: 86400 },
    });

    if (!res.ok) return {};

    const data = await res.json();
    const binding = data.results.bindings[0];

    if (!binding) return {};

    return {
      image: binding.image?.value || null,
      description: binding.artistDescription?.value || null,
      wikipedia: binding.wikipediaLink?.value || null,
      twitter: binding.twitter?.value
        ? `https://twitter.com/${binding.twitter.value}`
        : null,
      instagram: binding.instagram?.value
        ? `https://instagram.com/${binding.instagram.value}`
        : null,
      facebook: binding.facebook?.value
        ? `https://facebook.com/${binding.facebook.value}`
        : null,
      youtube: binding.youtube?.value
        ? `https://youtube.com/channel/${binding.youtube.value}`
        : null,
      spotify: binding.spotify?.value
        ? `https://open.spotify.com/artist/${binding.spotify.value}`
        : null,
    };
  } catch (error) {
    console.error("Wikidata fetch error:", error);
    return {};
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const artistId = searchParams.get("id");

  if (!artistId) {
    return NextResponse.json({ error: "Missing artist ID" }, { status: 400 });
  }

  // Fetch data from both sources in parallel
  const [wikidataInfo, mbData] = await Promise.all([
    fetchWikidataInfo(artistId),
    fetchMBData(artistId),
  ]);

  const artistInfo: ArtistInfo = {
    image: wikidataInfo.image || null,
    description: wikidataInfo.description || null,
    wikipedia: wikidataInfo.wikipedia || null,
    twitter: wikidataInfo.twitter || null,
    instagram: wikidataInfo.instagram || null,
    facebook: wikidataInfo.facebook || null,
    youtube: wikidataInfo.youtube || null,
    spotify: wikidataInfo.spotify || null,
    officialSite: mbData.officialSite,
    genres: [],
    beginDate: null,
    endDate: null,
    country: null,
  };

  const artist = {
    id: artistId,
    name: mbData.name || null,
    country: mbData.country || null,
    lifeSpan: mbData.lifeSpan || null,
  };

  return NextResponse.json({ artistInfo, artist });
}
