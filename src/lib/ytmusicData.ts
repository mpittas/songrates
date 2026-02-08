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

// ─── Artist Albums ──────────────────────────────────────────────────────────────

export async function getYTMusicArtistAlbums(
  artistId: string,
): Promise<Album[]> {
  const cacheKey = `ytm-artist-albums:${artistId}`;
  const cached = searchCache.get(cacheKey);
  if (cached) return cached as Album[];

  const ytmusic = await getYTMusic();
  const artist = await ytmusic.getArtist(artistId);

  const albums: Album[] = (artist.topAlbums || []).map((a) => ({
    id: a.albumId,
    title: a.name,
    artistName: a.artist?.name || artist.name,
    releaseDate: a.year ? String(a.year) : undefined,
    thumbnailUrl: ytmusicThumb(a.thumbnails, 544),
  }));

  searchCache.set(cacheKey, albums, 3600);
  return albums;
}

// ─── Artist Other Releases (singles, etc.) ──────────────────────────────────────

export async function getYTMusicArtistReleases(
  artistId: string,
): Promise<{ [type: string]: Album[] }> {
  const cacheKey = `ytm-artist-releases:${artistId}`;
  const cached = searchCache.get(cacheKey);
  if (cached) return cached as { [type: string]: Album[] };

  const ytmusic = await getYTMusic();
  const artist = await ytmusic.getArtist(artistId);

  const releases: { [type: string]: Album[] } = {};

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

  const result: AlbumInfo = {
    id: albumId,
    title: album.name,
    artist: {
      name: album.artist?.name || "Unknown Artist",
      id: album.artist?.artistId || "",
    },
    type: "Album",
    primaryType: "Album",
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
