import { NextRequest } from "next/server";
import { handleApiRequest, successResponse } from "@/lib/api-utils";

const MB_USER_AGENT = "SongRates/1.0 (mpittas@gmail.com)";
const MB_BASE_URL = "https://musicbrainz.org/ws/2";

interface Track {
  id: string;
  title: string;
  number: string;
  length?: number;
}

interface Release {
  id: string;
  date?: string;
}

interface Media {
  tracks?: Track[];
}

async function fetchTracks(albumId: string) {
  // 1. Get releases for this Release Group
  const releasesRes = await fetch(
    `${MB_BASE_URL}/release-group/${albumId}?inc=releases&fmt=json`,
    {
      headers: { "User-Agent": MB_USER_AGENT, Accept: "application/json" },
      next: { revalidate: 3600 },
    },
  );
  const releasesData = await releasesRes.json();

  // Pick oldest release
  const release = (releasesData.releases as Release[])?.sort((a, b) =>
    (a.date || "9999").localeCompare(b.date || "9999"),
  )[0];

  if (!release) {
    return { id: albumId, title: releasesData.title, tracks: [] };
  }

  // 2. Fetch tracks for that release
  const tracksRes = await fetch(
    `${MB_BASE_URL}/release/${release.id}?inc=recordings&fmt=json`,
    {
      headers: { "User-Agent": MB_USER_AGENT, Accept: "application/json" },
      next: { revalidate: 3600 },
    },
  );
  const tracksData = await tracksRes.json();

  // Flatten media into one list
  const tracks: Track[] =
    tracksData.media
      ?.flatMap((m: Media) => m.tracks || [])
      .map((t: Track) => ({
        id: t.id,
        title: t.title,
        number: t.number,
        length: t.length,
      })) || [];

  return {
    id: albumId,
    title: releasesData.title,
    tracks,
  };
}

export async function GET(request: NextRequest) {
  const albumId = request.nextUrl.searchParams.get("albumId");

  if (!albumId) {
    return successResponse({ tracks: [] }, "album");
  }

  return handleApiRequest(
    () => fetchTracks(albumId),
    "Failed to fetch tracks",
    "album",
  );
}
