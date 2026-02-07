import { NextRequest } from "next/server";
import {
  handleApiRequest,
  successResponse,
  errorResponse,
} from "@/lib/api-utils";
import { resolveAlbumId } from "@/lib/musicbrainz";

const MB_USER_AGENT = "SongRates/1.0 (mpittas@gmail.com)";
const MB_BASE_URL = "https://musicbrainz.org/ws/2";

interface Tag {
  count: number;
  name: string;
}

interface ArtistCredit {
  name: string;
  artist?: { id: string };
  joinphrase?: string;
}

interface Track {
  id: string;
  title: string;
  number: string;
  length?: number;
  "artist-credit"?: ArtistCredit[];
  recording?: { "artist-credit"?: ArtistCredit[] };
}

const mbFetchInit = {
  headers: { "User-Agent": MB_USER_AGENT, Accept: "application/json" },
  next: { revalidate: 3600 },
};

async function fetchWikipediaUrl(wikidataId: string): Promise<string | null> {
  try {
    const wdUrl = `https://www.wikidata.org/w/api.php?action=wbgetentities&ids=${wikidataId}&props=sitelinks/urls&format=json`;
    const wdRes = await fetch(wdUrl, { next: { revalidate: 3600 } });
    const wdData = await wdRes.json();
    return wdData.entities?.[wikidataId]?.sitelinks?.enwiki?.url || null;
  } catch (e) {
    console.error("Wikidata fetch error", e);
    return null;
  }
}

async function fetchTracks(releases: any[]): Promise<any[]> {
  if (!releases || releases.length === 0) return [];

  // Pick oldest release
  const release = releases.sort((a: { date?: string }, b: { date?: string }) =>
    (a.date || "9999").localeCompare(b.date || "9999"),
  )[0];

  if (!release) return [];

  const tracksRes = await fetch(
    `${MB_BASE_URL}/release/${release.id}?inc=recordings+artist-credits&fmt=json`,
    mbFetchInit,
  );
  const tracksData = await tracksRes.json();

  return (
    tracksData.media
      ?.flatMap((m: { tracks?: Track[] }) => m.tracks || [])
      .map((t: any) => ({
        id: t.id,
        title: t.title,
        number: t.number,
        length: t.length,
        recordingId: t.recording?.id,
        artists:
          (t["artist-credit"] || t.recording?.["artist-credit"])?.map(
            (ac: ArtistCredit) => ({
              id: ac.artist?.id,
              name: ac.name,
              joinPhrase: ac.joinphrase,
            }),
          ) || [],
      })) || []
  );
}

async function fetchAlbumInfo(albumId: string) {
  // Single combined fetch: release-group info + releases list in one call
  // This eliminates the duplicate release-group fetch that was happening before
  const url = `${MB_BASE_URL}/release-group/${albumId}?inc=artist-credits+tags+url-rels+ratings+releases&fmt=json`;

  const rgRes = await fetch(url, mbFetchInit);
  if (!rgRes.ok) throw new Error("MB Release Group Fetch Error");
  const rgData = await rgRes.json();

  const title = rgData.title;
  const artistName = rgData["artist-credit"]?.[0]?.name || "Unknown Artist";
  const artistId = rgData["artist-credit"]?.[0]?.artist?.id;
  const releaseDate = rgData["first-release-date"];
  const rating = rgData.rating?.score
    ? Math.round(rgData.rating.score * 2 * 10) / 10
    : null;
  const primaryType = rgData["primary-type"];
  const secondaryTypes = rgData["secondary-types"] || [];
  const type =
    secondaryTypes.length > 0 ? secondaryTypes.join(" / ") : primaryType;

  // Genres/Tags
  const genres =
    rgData.tags
      ?.sort((a: Tag, b: Tag) => b.count - a.count)
      .slice(0, 5)
      .map((t: Tag) => t.name) || [];

  // Extract links from relations
  const links: Record<string, string> = {};
  let wikidataId: string | null = null;

  if (rgData.relations) {
    rgData.relations.forEach(
      (rel: { type: string; url?: { resource: string } }) => {
        if (rel.url?.resource) {
          if (rel.type === "discogs") links.discogs = rel.url.resource;
          if (rel.type === "allmusic") links.allmusic = rel.url.resource;
          if (rel.type === "bandcamp") links.bandcamp = rel.url.resource;
          if (rel.type === "wikidata") {
            wikidataId = rel.url.resource.split("/").pop() || null;
          }
        }
      },
    );
  }

  // Parallel: fetch Wikipedia URL + tracks at the same time
  const [wikipediaUrl, tracks] = await Promise.all([
    wikidataId ? fetchWikipediaUrl(wikidataId) : Promise.resolve(null),
    fetchTracks(rgData.releases || []),
  ]);

  return {
    id: albumId,
    title,
    artist: { name: artistName, id: artistId },
    type,
    primaryType,
    secondaryTypes,
    releaseDate,
    genres,
    rating,
    wikipediaUrl,
    links,
    tracks,
  };
}

export async function GET(request: NextRequest) {
  const idParam = request.nextUrl.searchParams.get("id");

  if (!idParam) {
    return errorResponse("Missing id", 400);
  }

  // Resolve slug to full UUID server-side (instant if cached, fallback to MB search)
  const albumId = await resolveAlbumId(idParam);
  if (!albumId) {
    return errorResponse("Album not found", 404);
  }

  return handleApiRequest(
    () => fetchAlbumInfo(albumId),
    "Failed to fetch album info",
    "album",
  );
}
