/**
 * Batch enrichment fetchers.
 *
 * These are the request-minimisation layer: instead of N serial GETs to look
 * up N songs/albums/artists, we batch them into one `?ids=a,b,c` call per
 * chunk. Used by playlist rows, liked-item rows, and rated-item rows so the
 * first HTML paint is not blocked by per-row fetches.
 */

import {
  appleMusicFetch,
  STOREFRONT,
  artworkUrl,
  APPLE_MUSIC_REVALIDATE_SECONDS,
} from "./core";
import { appleTags } from "@/lib/cache";
import {
  artistsFromCatalogSongResource,
} from "./parsers";
import type {
  AppleSongEnrichment,
  AppleAlbumEnrichment,
  AppleArtistEnrichment,
} from "./types";

export type {
  AppleSongEnrichment,
  AppleAlbumEnrichment,
  AppleArtistEnrichment,
};

/** Apple `ids=` URLs get long; chunk to stay under practical limits. */
const ENRICH_CHUNK_SIZE = 60;

/**
 * Batch-fetch catalog songs with artist + album relationships (for playlist rows).
 * Used after the playlist response so the first HTML paint is not blocked.
 */
export async function fetchAppleSongEnrichmentsByIds(
  songIds: string[],
  storefront: string = STOREFRONT,
): Promise<Map<string, AppleSongEnrichment>> {
  const enrichmentMap = new Map<string, AppleSongEnrichment>();
  const uniqueIds = [...new Set(songIds.filter(Boolean))];

  for (let i = 0; i < uniqueIds.length; i += ENRICH_CHUNK_SIZE) {
    const chunk = uniqueIds.slice(i, i + ENRICH_CHUNK_SIZE);
    const ids = chunk.join(",");
    const songsData = await appleMusicFetch<{
      data?: Array<{
        id: string;
        attributes?: {
          name?: string;
          albumName?: string;
          durationInMillis?: number;
        };
        relationships?: {
          artists?: {
            data?: Array<{ id: string; attributes?: { name?: string } }>;
          };
          "featured-artists"?: {
            data?: Array<{ id: string; attributes?: { name?: string } }>;
          };
          albums?: { data?: Array<{ id: string }> };
        };
      }>;
    }>(`/catalog/${storefront}/songs?ids=${ids}&include=artists,albums`, {
      tags: uniqueIds.map((id) => appleTags.album(id)),
      revalidate: APPLE_MUSIC_REVALIDATE_SECONDS,
    });

    if (!songsData?.data) continue;

    for (const song of songsData.data) {
      const songAlbum = song.relationships?.albums?.data?.[0];
      enrichmentMap.set(song.id, {
        name: song.attributes?.name,
        artists: artistsFromCatalogSongResource(song),
        albumId: songAlbum?.id,
        albumName: song.attributes?.albumName,
        durationMs: song.attributes?.durationInMillis,
      });
    }
  }

  return enrichmentMap;
}

/**
 * Batch-fetch catalog albums with artist relationships (for liked-album rows).
 */
export async function fetchAppleAlbumEnrichmentsByIds(
  albumIds: string[],
  storefront: string = STOREFRONT,
): Promise<Map<string, AppleAlbumEnrichment>> {
  const enrichmentMap = new Map<string, AppleAlbumEnrichment>();
  const uniqueIds = [...new Set(albumIds.filter(Boolean))];

  for (let i = 0; i < uniqueIds.length; i += ENRICH_CHUNK_SIZE) {
    const chunk = uniqueIds.slice(i, i + ENRICH_CHUNK_SIZE);
    const ids = chunk.join(",");
    const data = await appleMusicFetch<{
      data?: Array<{
        id: string;
        attributes?: {
          name?: string;
          artistName?: string;
          releaseDate?: string;
          artwork?: { url?: string };
        };
        relationships?: {
          artists?: { data?: Array<{ id: string }> };
        };
      }>;
    }>(`/catalog/${storefront}/albums?ids=${ids}&include=artists`, {
      tags: uniqueIds.map((id) => appleTags.album(id)),
      revalidate: APPLE_MUSIC_REVALIDATE_SECONDS,
    });

    if (!data?.data) continue;

    for (const album of data.data) {
      const attrs = album.attributes;
      const artistRel = album.relationships?.artists?.data?.[0];
      enrichmentMap.set(album.id, {
        name: attrs?.name || "",
        artistName: attrs?.artistName || "",
        artistId: artistRel?.id,
        artworkUrl: attrs?.artwork?.url
          ? artworkUrl(attrs.artwork.url, 300)
          : undefined,
        releaseDate: attrs?.releaseDate,
      });
    }
  }

  return enrichmentMap;
}

/**
 * Batch-fetch catalog artists (for liked-artist rows).
 */
export async function fetchAppleArtistEnrichmentsByIds(
  artistIds: string[],
  storefront: string = STOREFRONT,
): Promise<Map<string, AppleArtistEnrichment>> {
  const enrichmentMap = new Map<string, AppleArtistEnrichment>();
  const uniqueIds = [...new Set(artistIds.filter(Boolean))];

  for (let i = 0; i < uniqueIds.length; i += ENRICH_CHUNK_SIZE) {
    const chunk = uniqueIds.slice(i, i + ENRICH_CHUNK_SIZE);
    const ids = chunk.join(",");
    const data = await appleMusicFetch<{
      data?: Array<{
        id: string;
        attributes?: {
          name?: string;
          genreNames?: string[];
          artwork?: { url?: string };
        };
      }>;
    }>(`/catalog/${storefront}/artists?ids=${ids}`, {
      tags: uniqueIds.map((id) => appleTags.artist(id)),
      revalidate: APPLE_MUSIC_REVALIDATE_SECONDS,
    });

    if (!data?.data) continue;

    for (const artist of data.data) {
      const attrs = artist.attributes;
      enrichmentMap.set(artist.id, {
        name: attrs?.name || "",
        artworkUrl: attrs?.artwork?.url
          ? artworkUrl(attrs.artwork.url, 300)
          : undefined,
        genres: attrs?.genreNames,
      });
    }
  }

  return enrichmentMap;
}
