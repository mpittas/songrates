import { NextRequest } from "next/server";
import {
  handleApiRequest,
  successResponse,
  errorResponse,
} from "@/lib/api-utils";

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

async function fetchAlbumInfo(albumId: string) {
  // 1. Fetch Release Group Info
  const url = `${MB_BASE_URL}/release-group/${albumId}?inc=artist-credits+tags+url-rels+ratings&fmt=json`;

  const rgRes = await fetch(url, {
    headers: { "User-Agent": MB_USER_AGENT, Accept: "application/json" },
    next: { revalidate: 3600 },
  });

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

  // 2. Fetch Wikipedia URL via Wikidata
  let wikipediaUrl = null;
  const wikidataRel = rgData.relations?.find(
    (rel: { type: string; url?: { resource?: string } }) =>
      rel.type === "wikidata",
  );

  if (wikidataRel?.url?.resource) {
    const wikidataId = wikidataRel.url.resource.split("/").pop();
    try {
      const wdUrl = `https://www.wikidata.org/w/api.php?action=wbgetentities&ids=${wikidataId}&props=sitelinks/urls&format=json`;
      const wdRes = await fetch(wdUrl, { next: { revalidate: 3600 } });
      const wdData = await wdRes.json();
      const siteLink = wdData.entities?.[wikidataId]?.sitelinks?.enwiki;
      if (siteLink?.url) {
        wikipediaUrl = siteLink.url;
      }
    } catch (e) {
      console.error("Wikidata fetch error", e);
    }
  }

  // 3. Fetch Tracks
  const releasesRes = await fetch(
    `${MB_BASE_URL}/release-group/${albumId}?inc=releases&fmt=json`,
    {
      headers: { "User-Agent": MB_USER_AGENT, Accept: "application/json" },
      next: { revalidate: 3600 },
    },
  );
  const releasesData = await releasesRes.json();

  // Pick oldest release
  const release = releasesData.releases?.sort(
    (a: { date?: string }, b: { date?: string }) =>
      (a.date || "9999").localeCompare(b.date || "9999"),
  )[0];

  let tracks: Track[] = [];
  if (release) {
    const tracksRes = await fetch(
      `${MB_BASE_URL}/release/${release.id}?inc=recordings+artist-credits&fmt=json`,
      {
        headers: { "User-Agent": MB_USER_AGENT, Accept: "application/json" },
        next: { revalidate: 3600 },
      },
    );
    const tracksData = await tracksRes.json();

    tracks =
      tracksData.media
        ?.flatMap((m: { tracks?: Track[] }) => m.tracks || [])
        .map((t: Track) => ({
          id: t.id,
          title: t.title,
          number: t.number,
          length: t.length,
          artists:
            (t["artist-credit"] || t.recording?.["artist-credit"])?.map(
              (ac: ArtistCredit) => ({
                id: ac.artist?.id,
                name: ac.name,
                joinPhrase: ac.joinphrase,
              }),
            ) || [],
        })) || [];
  }

  return {
    id: albumId,
    title,
    artist: { name: artistName, id: artistId },
    type,
    releaseDate,
    genres,
    rating,
    wikipediaUrl,
    tracks,
  };
}

export async function GET(request: NextRequest) {
  const albumId = request.nextUrl.searchParams.get("id");

  if (!albumId) {
    return errorResponse("Missing id", 400);
  }

  return handleApiRequest(
    () => fetchAlbumInfo(albumId),
    "Failed to fetch album info",
    "album",
  );
}
