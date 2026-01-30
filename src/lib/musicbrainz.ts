import { albumCache, artistCache, withCache } from "@/lib/cache";

const MB_USER_AGENT = "SongRates/1.0 (mpittas@gmail.com)";
const MB_BASE_URL = "https://musicbrainz.org/ws/2";

// Types
export interface Album {
  id: string;
  title: string;
  releaseDate?: string;
  wikipediaUrl?: string;
  wikidataId?: string;
}

export interface ArtistInfo {
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

export interface ArtistData {
  id: string;
  name: string | null;
  country: string | null;
  lifeSpan: any;
}

export interface GroupedReleases {
  [type: string]: {
    id: string;
    title: string;
    releaseDate?: string;
  }[];
}

// Helpers
function toThumbnailUrl(imageUrl: string, width: number = 250): string {
  if (
    imageUrl.includes("commons.wikimedia.org") ||
    imageUrl.includes("upload.wikimedia.org")
  ) {
    const separator = imageUrl.includes("?") ? "&" : "?";
    return `${imageUrl}${separator}width=${width}`;
  }
  return imageUrl;
}

// Data Fetching Functions

export async function getArtistData(artistId: string): Promise<{
  artistInfo: ArtistInfo;
  artist: ArtistData;
}> {
  const cacheKey = `artist-info:${artistId}`;

  // Try to get from cache first (manually to return full object)
  const cached = artistCache.get(cacheKey);
  if (cached) return cached;

  // Fetch logic
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

  const result = { artistInfo, artist };
  artistCache.set(cacheKey, result, 86400);
  return result;
}

export async function getArtistAlbums(artistId: string): Promise<Album[]> {
  const cacheKey = `albums:${artistId}`;

  const cached = albumCache.get(cacheKey);
  if (cached && cached.albums) return cached.albums;

  // Fetch Release Groups
  const url = `${MB_BASE_URL}/release-group?artist=${artistId}&type=album&release-group-status=website-default&fmt=json&limit=100&inc=url-rels`;

  try {
    const res = await fetch(url, {
      headers: { "User-Agent": MB_USER_AGENT, Accept: "application/json" },
      next: { revalidate: 3600 },
    });

    if (!res.ok) throw new Error("MB API Error");
    const data = await res.json();

    const excludedSecondaryTypes = [
      "Compilation",
      "Live",
      "Spokenword",
      "Interview",
      "Audiobook",
      "Audio drama",
      "Mixtape/Street",
      "Demo",
      "DJ-mix",
      "Field recording",
    ];

    const basicAlbums = data["release-groups"]
      .filter((rg: any) => {
        if (rg["primary-type"] !== "Album") return false;
        if (!rg["secondary-types"] || rg["secondary-types"].length === 0)
          return true;
        return !rg["secondary-types"].some((type: string) =>
          excludedSecondaryTypes.includes(type),
        );
      })
      .map((rg: any) => {
        const wikidataRel = rg.relations?.find(
          (rel: any) => rel.type === "wikidata",
        );
        return {
          id: rg.id,
          title: rg.title,
          releaseDate: rg["first-release-date"],
          wikidataId: wikidataRel?.url?.resource?.split("/").pop(),
        };
      })
      .sort((a: any, b: any) =>
        (b.releaseDate || "").localeCompare(a.releaseDate || ""),
      );

    // Fetch Wikipedia URLs
    const wikidataIds = basicAlbums
      .map((a: any) => a.wikidataId)
      .filter(Boolean);

    const wikiMap = new Map<string, string>();
    if (wikidataIds.length > 0) {
      const idsChunk = wikidataIds.slice(0, 50).join("|");
      const wdUrl = `https://www.wikidata.org/w/api.php?action=wbgetentities&ids=${idsChunk}&props=sitelinks/urls&format=json`;

      try {
        const wdRes = await fetch(wdUrl, { next: { revalidate: 3600 } });
        if (wdRes.ok) {
          const wdData = await wdRes.json();
          const entities = wdData.entities || {};
          Object.keys(entities).forEach((id) => {
            const siteLink = entities[id].sitelinks?.enwiki;
            if (siteLink?.url) wikiMap.set(id, siteLink.url);
          });
        }
      } catch (e) {
        console.error("Wikidata fetch error:", e);
      }
    }

    const albums = basicAlbums.map((album: any) => ({
      id: album.id,
      title: album.title,
      releaseDate: album.releaseDate,
      wikipediaUrl: album.wikidataId
        ? wikiMap.get(album.wikidataId)
        : undefined,
    }));

    albumCache.set(cacheKey, { albums }, 86400);
    return albums;
  } catch (e) {
    console.error(e);
    return [];
  }
}

export async function getOtherReleases(
  artistId: string,
): Promise<GroupedReleases> {
  // Use a separate cache key or shared?
  const cacheKey = `other-releases:${artistId}`;

  // Note: we're using albumCache for this too as it stores similar data structure (or just any)
  const cached = albumCache.get(cacheKey);
  if (cached && cached.releases) return cached.releases;

  try {
    const limit = 100;
    let offset = 0;
    let allReleaseGroups: any[] = [];
    let hasMore = true;

    // Safety brake to prevent infinite loops or excessively long waits
    const maxPages = 10;
    let pageCount = 0;

    while (hasMore && pageCount < maxPages) {
      const url = `${MB_BASE_URL}/release-group?artist=${artistId}&release-group-status=website-default&fmt=json&limit=${limit}&offset=${offset}`;

      const res = await fetch(url, {
        headers: { "User-Agent": MB_USER_AGENT, Accept: "application/json" },
        next: { revalidate: 3600 },
      });

      if (!res.ok) throw new Error("MB API Error");
      const data = await res.json();

      const pageGroups = data["release-groups"] || [];
      allReleaseGroups = [...allReleaseGroups, ...pageGroups];

      if (pageGroups.length < limit) {
        hasMore = false;
      } else {
        offset += limit;
        pageCount++;
        // Be nice to the API
        await new Promise((resolve) => setTimeout(resolve, 1100));
      }
    }

    // Group releases logic
    const grouped: GroupedReleases = {};

    allReleaseGroups.forEach((rg) => {
      const primaryType = rg["primary-type"];
      const secondaryTypes = rg["secondary-types"] || [];

      // Skip regular studio albums (those are shown in the main section)
      if (primaryType === "Album" && secondaryTypes.length === 0) {
        return;
      }

      // Skip albums with only "Soundtrack" or "Remix" secondary types (also in main section)
      if (primaryType === "Album") {
        const allowedInMainSection = ["Soundtrack", "Remix"];
        const hasOnlyAllowed = secondaryTypes.every((t: string) =>
          allowedInMainSection.includes(t),
        );
        if (hasOnlyAllowed) {
          return;
        }
      }

      // Determine the category for this release
      let category: string;

      if (primaryType === "Single") {
        category = "Singles";
      } else if (primaryType === "EP") {
        category = "EPs";
      } else if (secondaryTypes.includes("Compilation")) {
        category = "Compilations";
      } else if (secondaryTypes.includes("Live")) {
        category = "Live Albums";
      } else if (primaryType === "Album") {
        // Other album types we excluded from main
        category = "Other Albums";
      } else {
        category = "Other";
      }

      if (!grouped[category]) {
        grouped[category] = [];
      }

      grouped[category].push({
        id: rg.id,
        title: rg.title,
        releaseDate: rg["first-release-date"],
      });
    });

    // Sort each category
    Object.keys(grouped).forEach((key) => {
      grouped[key].sort((a, b) =>
        (b.releaseDate || "").localeCompare(a.releaseDate || ""),
      );
    });

    albumCache.set(cacheKey, { releases: grouped }, 86400);
    return grouped;
  } catch (e) {
    console.error(e);
    return {};
  }
}

// Private Helpers

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
      headers: { "User-Agent": MB_USER_AGENT, Accept: "application/json" },
      next: { revalidate: 86400 },
    });
    if (!res.ok) return {};
    const data = await res.json();
    const binding = data.results.bindings[0];
    if (!binding) return {};
    return {
      image: binding.image?.value ? toThumbnailUrl(binding.image.value) : null,
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
