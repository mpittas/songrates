import { albumCache, artistCache, searchCache, withCache } from "@/lib/cache";

const MB_USER_AGENT = "SongRates/1.0 (mpittas@gmail.com)";
const MB_BASE_URL = "https://musicbrainz.org/ws/2";

import { Album, ArtistData, ArtistInfo, GroupedReleases } from "@/types/music";

export function toThumbnailUrl(imageUrl: string, width: number = 250): string {
  // Ensure we are using https
  let url = imageUrl.replace(/^http:\/\//i, "https://");

  if (
    url.includes("commons.wikimedia.org") ||
    url.includes("upload.wikimedia.org")
  ) {
    const separator = url.includes("?") ? "&" : "?";
    return `${url}${separator}width=${width}`;
  }
  return url;
}

export async function getArtistData(artistId: string): Promise<{
  artistInfo: ArtistInfo;
  artist: ArtistData;
}> {
  const cacheKey = `artist-info:${artistId}`;

  const cached = artistCache.get(cacheKey);
  if (cached) return cached;

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
  const cacheKey = `other-releases:${artistId}`;

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

      if (!res.ok) {
        console.error(
          `MB API Error: ${res.status} ${res.statusText} for URL: ${url}`,
        );
        throw new Error(`MB API Error: ${res.status} ${res.statusText}`);
      }
      const data = await res.json();

      const pageGroups = data["release-groups"] || [];
      allReleaseGroups = [...allReleaseGroups, ...pageGroups];

      if (pageGroups.length < limit) {
        hasMore = false;
      } else {
        offset += limit;
        pageCount++;
        // Minimal delay to respect rate limits (MusicBrainz allows 1 req/sec)
        // Only delay if we need more pages
        if (hasMore) {
          await new Promise((resolve) => setTimeout(resolve, 250));
        }
      }
    }

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

export async function searchArtists(query: string): Promise<any[]> {
  const cacheKey = `search:${query}`;
  const cached = searchCache.get(cacheKey);
  if (cached) return cached;

  try {
    const url = `${MB_BASE_URL}/artist?query=${encodeURIComponent(query)}&limit=10&fmt=json`;
    const res = await fetch(url, {
      headers: { "User-Agent": MB_USER_AGENT, Accept: "application/json" },
      next: { revalidate: 3600 },
    });

    if (!res.ok) return [];

    const data = await res.json();
    const artists = (data.artists || []).map((artist: any) => ({
      id: artist.id,
      name: artist.name,
      country: artist.country,
      lifeSpan: artist["life-span"],
      type: artist.type,
      disambiguation: artist.disambiguation,
    }));

    searchCache.set(cacheKey, artists);
    return artists;
  } catch (e) {
    console.error("Search error:", e);
    return [];
  }
}

/**
 * Search for albums (release-groups)
 */
export async function searchReleaseGroups(query: string): Promise<any[]> {
  const cacheKey = `search-rg:${query}`;
  const cached = searchCache.get(cacheKey);
  if (cached) return cached;

  try {
    const url = `${MB_BASE_URL}/release-group?query=${encodeURIComponent(query)}&limit=100&fmt=json`;
    const res = await fetch(url, {
      headers: { "User-Agent": MB_USER_AGENT, Accept: "application/json" },
      next: { revalidate: 3600 },
    });

    if (!res.ok) return [];
    const data = await res.json();
    const releaseGroups = data["release-groups"] || [];

    searchCache.set(cacheKey, releaseGroups);
    return releaseGroups;
  } catch (e) {
    console.error("Search RG error:", e);
    return [];
  }
}

import { parseSlug } from "@/lib/utils";

/**
 * Resolve an Artist ID from a slug (e.g. "adele-75a72702" -> full UUID)
 *
 * Resolution strategy (in order):
 *   1. Cache hit (pre-populated by searchService when results are generated)
 *   2. MB artist name search with retry + backoff (handles rate limiting)
 *   3. Returns null only if all attempts fail
 */
export async function resolveArtistId(slug: string): Promise<string | null> {
  // 1. Check if it's already a full UUID
  if (
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slug)
  ) {
    return slug;
  }

  // 2. Parse slug
  const { name, shortId } = parseSlug(slug);
  if (!shortId || shortId.length < 8) {
    return slug;
  }

  // 3. Check cache for slug mapping (pre-populated by searchService)
  const cacheKey = `resolve-artist:${slug}`;
  const cachedId = searchCache.get(cacheKey);
  if (cachedId) return cachedId as string;

  // 4. Search with retry + backoff (MusicBrainz rate-limits at 1 req/sec)
  const MAX_RETRIES = 3;
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    if (attempt > 0) {
      await new Promise((r) => setTimeout(r, 1100 * attempt));
    }

    try {
      const url = `${MB_BASE_URL}/artist?query=${encodeURIComponent(name)}&limit=25&fmt=json`;
      const res = await fetch(url, {
        headers: { "User-Agent": MB_USER_AGENT, Accept: "application/json" },
        next: { revalidate: 3600 },
      });

      if (res.status === 503 || res.status === 429) {
        continue; // Rate limited — retry after backoff
      }
      if (!res.ok) break;

      const data = await res.json();
      const match = (data.artists || []).find((a: any) =>
        a.id.startsWith(shortId),
      );

      if (match) {
        searchCache.set(cacheKey, match.id, 86400);
        return match.id;
      }
      break; // Got a valid response but no match — don't retry
    } catch (e) {
      console.error(`resolveArtistId attempt ${attempt + 1} failed:`, e);
    }
  }

  return null;
}

/**
 * Resolve an Album ID from a slug
 *
 * Resolution strategy (in order):
 *   1. Cache hit (pre-populated by searchService when results are generated)
 *   2. MB release-group name search with retry + backoff (handles rate limiting)
 *   3. Direct MB release-group lookup by short ID prefix (fallback for generic names)
 *   4. Returns null only if all attempts fail
 */
export async function resolveAlbumId(slug: string): Promise<string | null> {
  if (
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slug)
  ) {
    return slug;
  }

  const { name, shortId } = parseSlug(slug);
  if (!shortId || shortId.length < 8) return slug;

  // 1. Check cache for slug mapping (pre-populated by searchService)
  const cacheKey = `resolve-album:${slug}`;
  const cachedId = searchCache.get(cacheKey);
  if (cachedId) return cachedId as string;

  // 2. Search with retry + backoff (MusicBrainz rate-limits at 1 req/sec)
  const MAX_RETRIES = 3;
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    if (attempt > 0) {
      await new Promise((r) => setTimeout(r, 1100 * attempt));
    }

    try {
      const url = `${MB_BASE_URL}/release-group?query=${encodeURIComponent(name)}&limit=100&fmt=json`;
      const res = await fetch(url, {
        headers: { "User-Agent": MB_USER_AGENT, Accept: "application/json" },
        next: { revalidate: 3600 },
      });

      if (res.status === 503 || res.status === 429) {
        continue; // Rate limited — retry after backoff
      }
      if (!res.ok) break;

      const data = await res.json();
      const match = (data["release-groups"] || []).find((rg: any) =>
        rg.id.startsWith(shortId),
      );

      if (match) {
        searchCache.set(cacheKey, match.id, 86400);
        return match.id;
      }
      break; // Got a valid response but no match — try direct lookup
    } catch (e) {
      console.error(`resolveAlbumId search attempt ${attempt + 1} failed:`, e);
    }
  }

  // 3. Direct lookup fallback: try fetching the release-group by reconstructed UUID
  //    The shortId is the first segment of a UUID (8 hex chars). We can try common
  //    UUID patterns by querying MB browse with the short prefix.
  try {
    await new Promise((r) => setTimeout(r, 1100));
    const browseUrl = `${MB_BASE_URL}/release-group?query=rgid:${shortId}*&limit=10&fmt=json`;
    const browseRes = await fetch(browseUrl, {
      headers: { "User-Agent": MB_USER_AGENT, Accept: "application/json" },
      next: { revalidate: 3600 },
    });

    if (browseRes.ok) {
      const browseData = await browseRes.json();
      const directMatch = (browseData["release-groups"] || []).find((rg: any) =>
        rg.id.startsWith(shortId),
      );
      if (directMatch) {
        searchCache.set(cacheKey, directMatch.id, 86400);
        return directMatch.id;
      }
    }
  } catch (e) {
    console.error("resolveAlbumId direct lookup failed:", e);
  }

  return null;
}

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
      wikipedia: binding.wikipediaLink?.value
        ? binding.wikipediaLink.value.replace(/^http:\/\//i, "https://")
        : null,
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
