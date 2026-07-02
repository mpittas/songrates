/**
 * Artist domain operations.
 *
 * `getArtistWithViews` is the single entry point for an artist page: it pulls
 * the artist + all discography views in one Apple Music call, then a second
 * batched /songs call to resolve featured-artist IDs on top songs.
 */

import { cache } from "react";

import {
  appleMusicFetch,
  STOREFRONT,
  APPLE_MUSIC_REVALIDATE_SECONDS,
} from "./core";
import { artistCache, singleFlight, appleTags } from "@/lib/cache";
import {
  artistsFromCatalogSongResource,
  parseAlbumItems,
  sortByDateDesc,
} from "./parsers";
import type {
  ArtistDiscography,
  AppleArtistDetail,
  AppleTopSong,
} from "./types";

export type { ArtistDiscography };

/**
 * Classify an album into: "Album" | "EP" | "Single" | "Compilation"
 */
export function classifyAlbumType(album: {
  name: string;
  isSingle: boolean;
  isCompilation: boolean;
  trackCount?: number;
}): string {
  if (album.isCompilation) return "Compilation";
  if (album.isSingle) {
    const lower = album.name.toLowerCase();
    if (
      lower.includes(" ep") ||
      lower.includes("(ep)") ||
      lower.endsWith(" - ep")
    ) {
      return "EP";
    }
    return "Single";
  }
  return "Album";
}

/**
 * Fetch artist + discography views.
 *
 * The artist's full discography is split into two parallel Apple Music calls
 * instead of one giant `?views=...` request. Prolific artists (Drake, Michael
 * Jackson, etc.) return payloads large enough that Apple's gateway has been
 * observed returning 504s, which cascaded into Vercel function timeouts (300s)
 * and OOM kills. Splitting keeps each response small and lets either half
 * succeed independently — the page renders with whatever data arrives.
 *
 * Wrapped with React cache() so multiple components in the same render tree
 * (e.g. hero + top songs + discography) share a single upstream call.
 */
export const getArtistWithViews = cache(
  async (artistId: string): Promise<ArtistDiscography | null> => {
    const cacheKey = `am-artist-full-v4:${artistId}`;
    const cached = artistCache.get(cacheKey);
    if (cached) return cached as ArtistDiscography;

    return singleFlight(cacheKey, async () => {
      const tags = [appleTags.artist(artistId)];

      // Call 1 (critical): artist metadata + top songs + featured albums.
      // Call 2 (heavy): the four discography album-list views.
      // Run in parallel; each has the full revalidate window so the Data Cache
      // usually absorbs one or both.
      const [coreData, discoData] = await Promise.all([
        appleMusicFetch<any>(
          `/catalog/${STOREFRONT}/artists/${artistId}?views=top-songs,featured-albums&include[songs]=albums`,
          { tags, revalidate: APPLE_MUSIC_REVALIDATE_SECONDS },
        ),
        appleMusicFetch<any>(
          `/catalog/${STOREFRONT}/artists/${artistId}?views=full-albums,singles,compilation-albums,appears-on-albums`,
          { tags, revalidate: APPLE_MUSIC_REVALIDATE_SECONDS },
        ).catch((err) => {
          // Discography is best-effort: never let a failure here take down the
          // whole page. Top songs + featured albums still render.
          console.warn(
            `Artist ${artistId}: discography fetch failed, rendering partial:`,
            err,
          );
          return null;
        }),
      ]);

      const item = coreData?.data?.[0];
      if (!item) return null;

      const a = item.attributes || {};
      const coreViews = item.views || {};
      const discoViews = discoData?.data?.[0]?.views || {};

      const artist: AppleArtistDetail = {
        id: item.id,
        name: a.name || "",
        genres: a.genreNames || [],
        artworkUrl: a.artwork?.url,
        url: a.url,
      };

      // Parse top songs from the view
      const topSongsData = coreViews["top-songs"]?.data || [];
      const topSongs: AppleTopSong[] = topSongsData.map((s: any) => {
        const sa = s.attributes || {};
        const songAlbumRel = s.relationships?.albums?.data?.[0];
        return {
          id: s.id,
          name: sa.name || "",
          artistName: sa.artistName || "",
          artistId: artistId,
          albumName: sa.albumName,
          albumId: songAlbumRel?.id,
          artworkUrl: sa.artwork?.url,
          releaseDate: sa.releaseDate,
          durationMs: sa.durationInMillis,
          trackNumber: sa.trackNumber,
          url: sa.url,
        };
      });

      if (topSongs.length > 0) {
        const ids = topSongs.map((t) => t.id).join(",");
        const songsData = await appleMusicFetch<any>(
          `/catalog/${STOREFRONT}/songs?ids=${ids}&include=artists,albums`,
          {
            tags,
            revalidate: APPLE_MUSIC_REVALIDATE_SECONDS,
          },
        );
        if (songsData?.data) {
          const artistMap = new Map<string, { id: string; name: string }[]>();
          for (const song of songsData.data) {
            artistMap.set(song.id, artistsFromCatalogSongResource(song));
          }
          for (const ts of topSongs) {
            const list = artistMap.get(ts.id);
            if (list && list.length > 0) {
              ts.artists = list;
              ts.artistId = list[0].id;
            } else if (artist.id && ts.artistName) {
              ts.artists = [{ id: artist.id, name: ts.artistName }];
            }
          }
        } else {
          for (const ts of topSongs) {
            if (artist.id && ts.artistName) {
              ts.artists = [{ id: artist.id, name: ts.artistName }];
            }
          }
        }
      }

      const result: ArtistDiscography = {
        artist,
        topSongs,
        featuredAlbums: sortByDateDesc(
          parseAlbumItems(coreViews["featured-albums"]?.data || []),
        ),
        fullAlbums: sortByDateDesc(
          parseAlbumItems(discoViews["full-albums"]?.data || []),
        ),
        singles: sortByDateDesc(
          parseAlbumItems(discoViews["singles"]?.data || []),
        ),
        compilations: sortByDateDesc(
          parseAlbumItems(discoViews["compilation-albums"]?.data || []),
        ),
        appearsOn: sortByDateDesc(
          parseAlbumItems(discoViews["appears-on-albums"]?.data || []),
        ),
      };

      artistCache.set(cacheKey, result, 86400);
      return result;
    });
  },
);
