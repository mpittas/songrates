/**
 * ytmusicData.ts — YTMusic data service for artist/album pages
 *
 * Provides getArtistFull() and getAlbumFull() using ytmusic-api,
 * returning data shaped to match the existing UI component contracts.
 */

import { getYTMusic } from "@/lib/ytmusic";
import { searchCache } from "@/lib/cache";
import type { AlbumInfo, ArtistInfo, TrackInfo, Album } from "@/types/music";

/**
 * Upscale a lh3.googleusercontent.com thumbnail URL to the requested size.
 * YTMusic sometimes returns only small thumbnails, but the URLs support
 * arbitrary sizes via the =wN-hN-l90-rj suffix.
 */
function ytmusicThumb(
  thumbnails: { url: string; width: number; height: number }[] | undefined,
  size: number = 544,
): string | undefined {
  if (!thumbnails || thumbnails.length === 0) return undefined;
  const url = thumbnails[thumbnails.length - 1]?.url;
  if (!url) return undefined;
  return url.replace(/=w\d+-h\d+/, `=w${size}-h${size}`);
}

// ─── Artist Data ────────────────────────────────────────────────────────────────

export async function getYTMusicArtistData(artistId: string): Promise<{
  artistInfo: ArtistInfo;
  artist: { id: string; name: string; country: string | null; lifeSpan: any };
}> {
  const cacheKey = `ytm-artist-data:${artistId}`;
  const cached = searchCache.get(cacheKey);
  if (cached)
    return cached as {
      artistInfo: ArtistInfo;
      artist: {
        id: string;
        name: string;
        country: string | null;
        lifeSpan: any;
      };
    };

  const ytmusic = await getYTMusic();
  const artist = await ytmusic.getArtist(artistId);

  const thumbnail = ytmusicThumb(artist.thumbnails, 800) || null;

  const artistInfo: ArtistInfo = {
    image: thumbnail,
    description: null,
    wikipedia: null,
    twitter: null,
    instagram: null,
    facebook: null,
    youtube: `https://music.youtube.com/channel/${artistId}`,
    spotify: null,
    officialSite: null,
    genres: [],
    beginDate: null,
    endDate: null,
    country: null,
  };

  const result = {
    artistInfo,
    artist: {
      id: artistId,
      name: artist.name,
      country: null,
      lifeSpan: null,
    },
  };

  searchCache.set(cacheKey, result, 3600);
  return result;
}

// ─── Classify topAlbums into Albums vs EPs ──────────────────────────────────────

/**
 * Detect whether a release is an EP based on its name and track count.
 */
function detectAlbumType(name: string, trackCount: number): string {
  const nameLC = name?.toLowerCase() || "";
  // Explicit EP markers in the title
  if (
    nameLC.includes("- ep") ||
    nameLC.endsWith(" ep") ||
    nameLC.includes("(ep)") ||
    nameLC.includes("versions)") ||
    nameLC.includes("remixes)") ||
    nameLC.includes("(remixes") ||
    nameLC.includes("(versions")
  ) {
    return "EP";
  } else if (trackCount === 1) {
    return "Single";
  } else if (trackCount <= 6) {
    return "EP";
  }
  return "Album";
}

/**
 * Shared helper: builds the full discography for an artist by merging
 * topAlbums (from getArtist) with searchAlbums(artistName) results.
 * topAlbums alone only returns a small subset; searchAlbums fills the gaps.
 * Each album's track count is fetched in parallel to classify Album vs EP.
 * Results are cached so both getYTMusicArtistAlbums and
 * getYTMusicArtistReleases can use them without duplicate API calls.
 */
async function classifyArtistAlbums(
  artistId: string,
): Promise<{ albums: Album[]; eps: Album[] }> {
  const cacheKey = `ytm-artist-classified:${artistId}`;
  const cached = searchCache.get(cacheKey);
  if (cached) return cached as { albums: Album[]; eps: Album[] };

  const ytmusic = await getYTMusic();
  const artist = await ytmusic.getArtist(artistId);
  const topAlbums = artist.topAlbums || [];

  // Build a merged list from topAlbums + searchAlbums, deduplicated by albumId
  const seen = new Set<string>();
  const candidates: {
    id: string;
    title: string;
    artistName: string;
    releaseDate?: string;
    thumbnailUrl?: string;
  }[] = [];

  // 1. Add topAlbums first (these are authoritative)
  for (const a of topAlbums) {
    if (!a.albumId || seen.has(a.albumId)) continue;
    seen.add(a.albumId);
    candidates.push({
      id: a.albumId,
      title: a.name,
      artistName: a.artist?.name || artist.name,
      releaseDate: a.year ? String(a.year) : undefined,
      thumbnailUrl: ytmusicThumb(a.thumbnails, 544),
    });
  }

  // 2. Supplement with searchAlbums(artistName), filtered to same artistId
  try {
    const searchResults = await ytmusic.searchAlbums(artist.name);
    for (const sr of searchResults) {
      if (!sr.albumId || seen.has(sr.albumId)) continue;
      if (sr.artist?.artistId !== artistId) continue;
      seen.add(sr.albumId);
      candidates.push({
        id: sr.albumId,
        title: sr.name,
        artistName: sr.artist?.name || artist.name,
        releaseDate: sr.year ? String(sr.year) : undefined,
        thumbnailUrl: ytmusicThumb(sr.thumbnails, 544),
      });
    }
  } catch {
    // Search failed — continue with topAlbums only
  }

  // Fetch track counts for all candidates in parallel
  const detailed = await Promise.all(
    candidates.map(async (a) => {
      try {
        const detail = await ytmusic.getAlbum(a.id);
        return { ...a, trackCount: detail.songs?.length || 0 };
      } catch {
        return { ...a, trackCount: 99 };
      }
    }),
  );

  const albums: Album[] = [];
  const eps: Album[] = [];

  for (const d of detailed) {
    const type = detectAlbumType(d.title, d.trackCount);
    const entry: Album = {
      id: d.id,
      title: d.title,
      artistName: d.artistName,
      releaseDate: d.releaseDate,
      thumbnailUrl: d.thumbnailUrl,
    };
    if (type === "EP") {
      eps.push(entry);
    } else {
      albums.push(entry);
    }
  }

  const result = { albums, eps };
  searchCache.set(cacheKey, result, 3600);
  return result;
}

// ─── Artist Albums ──────────────────────────────────────────────────────────────

export async function getYTMusicArtistAlbums(
  artistId: string,
): Promise<Album[]> {
  const cacheKey = `ytm-artist-albums:${artistId}`;
  const cached = searchCache.get(cacheKey);
  if (cached) return cached as Album[];

  const { albums } = await classifyArtistAlbums(artistId);

  searchCache.set(cacheKey, albums, 3600);
  return albums;
}

// ─── Artist Other Releases (EPs, singles, etc.) ─────────────────────────────────

export async function getYTMusicArtistReleases(
  artistId: string,
): Promise<{ [type: string]: Album[] }> {
  const cacheKey = `ytm-artist-releases:${artistId}`;
  const cached = searchCache.get(cacheKey);
  if (cached) return cached as { [type: string]: Album[] };

  const ytmusic = await getYTMusic();
  const artist = await ytmusic.getArtist(artistId);
  const { eps } = await classifyArtistAlbums(artistId);

  const releases: { [type: string]: Album[] } = {};

  if (eps.length) {
    releases["EPs"] = eps;
  }

  if (artist.topSingles?.length) {
    releases["Singles"] = artist.topSingles.map((s) => ({
      id: s.albumId,
      title: s.name,
      artistName: s.artist?.name || artist.name,
      releaseDate: s.year ? String(s.year) : undefined,
      thumbnailUrl: ytmusicThumb(s.thumbnails, 544),
    }));
  }

  searchCache.set(cacheKey, releases, 3600);
  return releases;
}

// ─── Album Data ─────────────────────────────────────────────────────────────────

export async function getYTMusicAlbumInfo(albumId: string): Promise<AlbumInfo> {
  const cacheKey = `ytm-album-info:${albumId}`;
  const cached = searchCache.get(cacheKey);
  if (cached) return cached as AlbumInfo;

  const ytmusic = await getYTMusic();
  const album = await ytmusic.getAlbum(albumId);

  const thumbnail = ytmusicThumb(album.thumbnails, 544) || null;

  const tracks: TrackInfo[] = (album.songs || []).map((song, idx) => ({
    id: song.videoId,
    title: song.name,
    number: String(idx + 1),
    length: song.duration ? song.duration * 1000 : undefined,
    artists: song.artist
      ? [{ id: song.artist.artistId || "", name: song.artist.name }]
      : [],
    recordingId: song.videoId,
    albumId: albumId,
    albumTitle: album.name,
    albumImageUrl: thumbnail || undefined,
  }));

  // YT Music API returns "ALBUM" for everything — detect EPs/Singles by heuristic
  const detectedType = detectAlbumType(album.name, tracks.length);

  const result: AlbumInfo = {
    id: albumId,
    title: album.name,
    artist: {
      name: album.artist?.name || "Unknown Artist",
      id: album.artist?.artistId || "",
    },
    type: detectedType,
    primaryType: detectedType,
    secondaryTypes: [],
    releaseDate: album.year ? String(album.year) : "",
    genres: [],
    rating: null,
    wikipediaUrl: null,
    links: {},
    tracks,
    thumbnailUrl: thumbnail,
  };

  searchCache.set(cacheKey, result, 3600);
  return result;
}
