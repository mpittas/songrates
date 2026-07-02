/**
 * Batch enrichment fetchers.
 *
 * These are the request-minimisation layer: instead of N serial GETs to look
 * up N songs/albums/artists, we batch them into one `?ids=a,b,c` call per
 * chunk. Used by playlist rows, liked-item rows, and rated-item rows so the
 * first HTML paint is not blocked by per-row fetches.
 *
 * Chunks run with bounded concurrency (3 at a time) instead of sequentially,
 * so a 100-track playlist (2 chunks) finishes in one round-trip rather than
 * two. Concurrency is kept low to avoid tripping Apple Music's per-JWT rate
 * limiter.
 */

import {
  appleMusicFetch,
  STOREFRONT,
  artworkUrl,
  APPLE_MUSIC_REVALIDATE_SECONDS,
} from "./core";
import { appleTags, mapWithConcurrency } from "@/lib/cache";
import { artistsFromCatalogSongResource } from "./parsers";
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

/** Max concurrent chunk fetches per enrichment call. */
const ENRICH_CONCURRENCY = 3;

/** Split an array of IDs into fixed-size chunks. */
function chunkIds<T>(items: readonly T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
}

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
  if (uniqueIds.length === 0) return enrichmentMap;

  const chunks = chunkIds(uniqueIds, ENRICH_CHUNK_SIZE);

  await mapWithConcurrency(chunks, ENRICH_CONCURRENCY, async (chunk) => {
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

    if (!songsData?.data) return;

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
  });

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
  if (uniqueIds.length === 0) return enrichmentMap;

  const chunks = chunkIds(uniqueIds, ENRICH_CHUNK_SIZE);

  await mapWithConcurrency(chunks, ENRICH_CONCURRENCY, async (chunk) => {
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

    if (!data?.data) return;

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
  });

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
  if (uniqueIds.length === 0) return enrichmentMap;

  const chunks = chunkIds(uniqueIds, ENRICH_CHUNK_SIZE);

  await mapWithConcurrency(chunks, ENRICH_CONCURRENCY, async (chunk) => {
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

    if (!data?.data) return;

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
  });

  return enrichmentMap;
}
