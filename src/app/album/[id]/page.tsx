import { AlbumInfo } from "@/types/music";
import { resolveAlbumId } from "@/lib/musicbrainz";
import AlbumClient from "@/components/album/AlbumClient";
import { albumCache } from "@/lib/cache";

// ─── Data Fetching ─────────────────────────────────────────────────────────────

async function getAlbumInfo(id: string): Promise<AlbumInfo | null> {
  const cacheKey = `album-info:${id}`;
  const cached = albumCache.get(cacheKey);
  if (cached) return cached as AlbumInfo;

  const MB_BASE_URL = "https://musicbrainz.org/ws/2";
  const USER_AGENT = "SongRates/1.0 (mpittas@gmail.com)";
  const headers = { "User-Agent": USER_AGENT, Accept: "application/json" };

  try {
    // 1. Fetch Release Group + Releases in parallel
    const rgUrl = `${MB_BASE_URL}/release-group/${id}?inc=artists+url-rels+genres&fmt=json`;
    const releasesUrl = `${MB_BASE_URL}/release?release-group=${id}&inc=media+recordings+artist-credits&limit=100&fmt=json`;

    // Helper function with retry logic
    const fetchWithRetry = async (url: string): Promise<Response | null> => {
      let retryCount = 0;
      const maxRetries = 2;

      while (true) {
        const res = await fetch(url, { headers, next: { revalidate: 3600 } });

        if (res.ok) return res;

        // Don't retry on client errors (4xx)
        if (res.status < 500) {
          console.error(
            `MB API Error: ${res.status} ${res.statusText} for URL: ${url}`,
          );
          return null;
        }

        // Retry on server errors (5xx)
        if (retryCount >= maxRetries) {
          console.error(
            `MB API Error: ${res.status} ${res.statusText} for URL: ${url} (after ${maxRetries} retries)`,
          );
          return null;
        }

        retryCount++;
        console.log(
          `MB API ${res.status}, retrying in ${1000 * retryCount}ms...`,
        );
        await new Promise((resolve) => setTimeout(resolve, 1000 * retryCount));
      }
    };

    const [rgRes, releasesRes] = await Promise.all([
      fetchWithRetry(rgUrl),
      fetchWithRetry(releasesUrl),
    ]);

    if (!rgRes || !releasesRes) return null;

    const [rgData, releasesData] = await Promise.all([
      rgRes.json(),
      releasesRes.json(),
    ]);

    // 3. Find Best Release (Official > Most Tracks > Earliest)
    const releases = (releasesData.releases || []).filter(
      (r: any) => r.status === "Official",
    );

    // Fallback to any release if no official ones
    const candidates =
      releases.length > 0 ? releases : releasesData.releases || [];

    // Sort by track count (desc) then date (asc)
    candidates.sort((a: any, b: any) => {
      const countA = a.media?.[0]?.["track-count"] || 0;
      const countB = b.media?.[0]?.["track-count"] || 0;
      if (countB !== countA) return countB - countA;
      return (a.date || "9999").localeCompare(b.date || "9999");
    });

    const bestRelease = candidates[0];
    if (!bestRelease) return null;

    // 4. Map Tracks
    const tracks = (bestRelease.media || []).flatMap((medium: any) =>
      (medium.tracks || []).map((t: any) => ({
        id: t.id,
        title: t.title,
        length: t.length,
        position: t.position,
        number: t.number,
        recordingId: t.recording?.id,
        artists: (
          t["artist-credit"] ||
          t.recording?.["artist-credit"] ||
          []
        ).map((ac: any) => ({
          id: ac.artist?.id,
          name: ac.name,
          joinPhrase: ac.joinphrase,
        })),
      })),
    );

    // 5. Build Album Info
    const albumInfo: AlbumInfo = {
      id: rgData.id,
      title: rgData.title,
      artist: {
        id: rgData["artist-credit"]?.[0]?.artist?.id,
        name: rgData["artist-credit"]?.[0]?.name,
      },
      releaseDate: rgData["first-release-date"],
      type: rgData["primary-type"],
      genres: (rgData.genres || []).map((g: any) => g.name),
      rating: rgData.rating?.score
        ? Math.round(rgData.rating.score * 2 * 10) / 10
        : null,
      tracks,
      wikipediaUrl: rgData.relations?.find((r: any) => r.type === "wikipedia")
        ?.url?.resource,
      links: {
        discogs: rgData.relations?.find((r: any) => r.type === "discogs")?.url
          ?.resource,
        bandcamp: rgData.relations?.find((r: any) => r.type === "bandcamp")?.url
          ?.resource,
        spotify: rgData.relations?.find(
          (r: any) =>
            r.type === "streaming" && r.url?.resource?.includes("spotify"),
        )?.url?.resource,
        allmusic: rgData.relations?.find((r: any) => r.type === "allmusic")?.url
          ?.resource,
      },
    };

    albumCache.set(cacheKey, albumInfo, 3600);
    return albumInfo;
  } catch (error) {
    console.error(`Failed to fetch album info for ${id}:`, error);
    return null;
  }
}

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function AlbumPage({ params }: PageProps) {
  const { id: slug } = await params;

  // Resolve ID
  const id = await resolveAlbumId(Array.isArray(slug) ? slug[0] : slug);

  if (!id) {
    return (
      <div className="min-h-screen bg-[#050507] flex items-center justify-center text-neutral-600 font-mono text-sm">
        album not found (invalid id)
      </div>
    );
  }

  // Fetch Data (Server Side)
  const album = await getAlbumInfo(id);

  if (!album) {
    return (
      <div className="min-h-screen bg-[#050507] flex items-center justify-center text-neutral-600 font-mono text-sm">
        album not found
      </div>
    );
  }

  return <AlbumClient album={album} />;
}
