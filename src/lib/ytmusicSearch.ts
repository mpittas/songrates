/**
 * ytmusicSearch.ts — Pure YTMusic search service
 *
 * Uses YouTube Music IDs directly — no MusicBrainz dependency.
 * Artist pages use YTMusic artistId, album pages use YTMusic albumId.
 */

import { getYTMusic } from "@/lib/ytmusic";
import { searchCache } from "@/lib/cache";
import type {
  SearchCategory,
  SearchResult,
  ArtistSearchResult,
  AlbumSearchResult,
  SongSearchResult,
  GroupedSearchResults,
} from "@/types/search";

// ─── Thumbnail Helper ────────────────────────────────────────────────────────

/**
 * Upscale a lh3.googleusercontent.com thumbnail URL to the requested size.
 * YTMusic sometimes returns only 60px or 120px thumbnails, but the URLs
 * support arbitrary sizes via the =wN-hN-l90-rj suffix.
 */
function ytmusicThumb(
  thumbnails: { url: string; width: number; height: number }[] | undefined,
  size: number = 544,
): string | undefined {
  if (!thumbnails || thumbnails.length === 0) return undefined;
  // Take the last (largest) thumbnail as the base URL
  const url = thumbnails[thumbnails.length - 1]?.url;
  if (!url) return undefined;
  // Replace the =wN-hN-... suffix with the desired size
  return url.replace(/=w\d+-h\d+/, `=w${size}-h${size}`);
}

// ─── Constants ─────────────────────────────────────────────────────────────────

/** How many final results to return per type */
const RETURN_LIMITS = {
  artists: 10,
  albums: 10,
  songs: 15,
  allArtists: 3,
  allAlbums: 3,
  allSongs: 8,
} as const;

// ─── Validation ─────────────────────────────────────────────────────────────────

export function isValidQuery(query: string): boolean {
  return (
    typeof query === "string" &&
    query.trim().length >= 1 &&
    query.trim().length <= 200
  );
}

export function isValidCategory(category: string): category is SearchCategory {
  return ["all", "artist", "album", "song"].includes(category);
}

// ─── YTMusic Search ─────────────────────────────────────────────────────────────

async function searchYTMusicArtists(
  query: string,
  limit: number,
): Promise<ArtistSearchResult[]> {
  const cacheKey = `ytm:artist:${query.toLowerCase()}:${limit}`;
  const cached = searchCache.get(cacheKey);
  if (cached) return cached as ArtistSearchResult[];

  const ytmusic = await getYTMusic();
  const results = await ytmusic.searchArtists(query);

  // Deduplicate by artistId
  const seen = new Set<string>();
  const unique = results.filter((r) => {
    if (!r.artistId || seen.has(r.artistId)) return false;
    seen.add(r.artistId);
    return true;
  });

  const mapped: ArtistSearchResult[] = unique
    .slice(0, limit)
    .map((artist, index) => ({
      id: artist.artistId,
      type: "artist" as const,
      title: artist.name,
      score: 100 - index,
      artistType: "Artist",
      thumbnailUrl: ytmusicThumb(artist.thumbnails, 226),
    }));

  if (mapped.length > 0) {
    searchCache.set(cacheKey, mapped, 1800);
  }
  return mapped;
}

async function searchYTMusicAlbums(
  query: string,
  limit: number,
): Promise<AlbumSearchResult[]> {
  const cacheKey = `ytm:album:${query.toLowerCase()}:${limit}`;
  const cached = searchCache.get(cacheKey);
  if (cached) return cached as AlbumSearchResult[];

  const ytmusic = await getYTMusic();
  const results = await ytmusic.searchAlbums(query);

  // Deduplicate by albumId
  const seen = new Set<string>();
  const unique = results.filter((r) => {
    if (!r.albumId || seen.has(r.albumId)) return false;
    seen.add(r.albumId);
    return true;
  });

  const mapped: AlbumSearchResult[] = unique
    .slice(0, limit)
    .map((album, index) => {
      const artistName = album.artist?.name || "";
      return {
        id: album.albumId,
        type: "album" as const,
        title: album.name,
        subtitle: artistName,
        score: 100 - index,
        artistName,
        artistId: album.artist?.artistId || undefined,
        releaseDate: album.year ? String(album.year) : undefined,
        primaryType: "Album",
        thumbnailUrl: ytmusicThumb(album.thumbnails, 544),
      };
    });

  if (mapped.length > 0) {
    searchCache.set(cacheKey, mapped, 1800);
  }
  return mapped;
}

async function searchYTMusicSongs(
  query: string,
  limit: number,
): Promise<SongSearchResult[]> {
  const cacheKey = `ytm:song:${query.toLowerCase()}:${limit}`;
  const cached = searchCache.get(cacheKey);
  if (cached) return cached as SongSearchResult[];

  const ytmusic = await getYTMusic();
  const results = await ytmusic.searchSongs(query);

  // Deduplicate by videoId
  const seen = new Set<string>();
  const unique = results.filter((r) => {
    if (!r.videoId || seen.has(r.videoId)) return false;
    seen.add(r.videoId);
    return true;
  });

  const mapped: SongSearchResult[] = unique
    .slice(0, limit)
    .map((song, index) => {
      const artistName = song.artist?.name || "";
      const albumName = song.album?.name || "";
      const albumId = song.album?.albumId || undefined;

      return {
        id: song.videoId,
        type: "song" as const,
        title: song.name,
        subtitle: artistName,
        score: 100 - index,
        artistName,
        artistId: song.artist?.artistId || undefined,
        releaseCount: 0,
        officialReleaseCount: 0,
        hasAlbumRelease: !!albumId,
        length: song.duration ? song.duration * 1000 : undefined,
        releaseGroupId: albumId,
        releaseGroupTitle: albumName || undefined,
        thumbnailUrl: ytmusicThumb(song.thumbnails, 226),
        videoId: song.videoId,
      };
    });

  if (mapped.length > 0) {
    searchCache.set(cacheKey, mapped, 1800);
  }
  return mapped;
}

// ─── Main Exports ───────────────────────────────────────────────────────────────

export async function searchAll(query: string): Promise<GroupedSearchResults> {
  const [artists, albums, songs] = await Promise.all([
    searchYTMusicArtists(query, RETURN_LIMITS.allArtists),
    searchYTMusicAlbums(query, RETURN_LIMITS.allAlbums),
    searchYTMusicSongs(query, RETURN_LIMITS.allSongs),
  ]);

  return { artists, albums, songs };
}

export async function searchByCategory(
  query: string,
  category: Exclude<SearchCategory, "all">,
): Promise<SearchResult[]> {
  switch (category) {
    case "artist":
      return searchYTMusicArtists(query, RETURN_LIMITS.artists);
    case "album":
      return searchYTMusicAlbums(query, RETURN_LIMITS.albums);
    case "song":
      return searchYTMusicSongs(query, RETURN_LIMITS.songs);
    default:
      return [];
  }
}

export async function searchYTMusic(
  query: string,
  category: SearchCategory = "all",
): Promise<{ results: SearchResult[]; grouped?: GroupedSearchResults }> {
  if (!isValidQuery(query)) {
    return { results: [] };
  }

  const trimmed = query.trim();

  if (category === "all") {
    const grouped = await searchAll(trimmed);
    const flat: SearchResult[] = [
      ...grouped.artists.slice(0, RETURN_LIMITS.allArtists),
      ...grouped.albums.slice(0, RETURN_LIMITS.allAlbums),
      ...grouped.songs.slice(0, RETURN_LIMITS.allSongs),
    ];
    return { results: flat, grouped };
  }

  const results = await searchByCategory(trimmed, category);
  return { results };
}
