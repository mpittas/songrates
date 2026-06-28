import { NextResponse } from "next/server";
import { revalidateTag as nextRevalidateTag } from "next/cache";

export const CACHE_HEADERS = {
  artist: {
    "Cache-Control": "public, s-maxage=43200, stale-while-revalidate=604800",
  },
  album: {
    "Cache-Control": "public, s-maxage=43200, stale-while-revalidate=604800",
  },
  playlist: {
    "Cache-Control": "public, s-maxage=21600, stale-while-revalidate=86400",
  },
  search: {
    "Cache-Control": "public, s-maxage=21600, stale-while-revalidate=86400",
  },
  image: {
    "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=604800",
  },
} as const;

export function successResponse<T>(
  data: T,
  cacheType: keyof typeof CACHE_HEADERS = "artist",
  extraHeaders?: Record<string, string>,
): NextResponse {
  return NextResponse.json(data, {
    headers: { ...CACHE_HEADERS[cacheType], ...extraHeaders },
  });
}

export function errorResponse(
  message: string,
  status: number = 500,
): NextResponse {
  return NextResponse.json({ error: message }, { status });
}

export async function handleApiRequest<T>(
  fetcher: () => Promise<T>,
  errorMessage: string,
  cacheType: keyof typeof CACHE_HEADERS = "artist",
): Promise<NextResponse> {
  try {
    const data = await fetcher();
    return successResponse(data, cacheType);
  } catch (error) {
    console.error(`${errorMessage}:`, error);
    return errorResponse(errorMessage, 500);
  }
}

export async function getRouteId(
  params: Promise<{ id: string }>,
): Promise<string | null> {
  try {
    const { id } = await params;
    return id || null;
  } catch {
    return null;
  }
}

/**
 * Invalidate cached Apple Music data by tag.
 *
 * Use the helpers in appleTags (re-exported from @/lib/cache) so the tag string
 * matches what was set on the fetch:
 *
 *   revalidateAppleTag(appleTags.artist(artistId));   // artist page + top songs + views
 *   revalidateAppleTag(appleTags.album(albumId));     // album detail + track artists
 *   revalidateAppleTag(appleTags.playlist(playlistId));
 *   revalidateAppleTag(appleTags.search(query));
 *   revalidateAppleTag(appleTags.trending);
 *   revalidateAppleTag(appleTags.dailyTop100);
 *
 * songrates currently has no write paths that mutate Apple Music data, so this is
 * a no-op in practice today. Call it from the mutation point (Server Action or
 * webhook route) when one is introduced — e.g. an admin refresh button or a CMS
 * hook that re-pulls a playlist.
 *
 * `profile` controls the stale window (Next.js 16 requires it). The default
 * `"max"` serves stale content immediately while revalidating in the background
 * (recommended for catalog data that can tolerate eventual consistency). Pass
 * `{ expire: 0 }` for an immediate blocking revalidate, e.g. from a webhook.
 *
 * Must be called from a Server Action, Route Handler, or Server Component.
 */
export function revalidateAppleTag(
  tag: string,
  profile: string | { expire?: number } = "max",
): void {
  nextRevalidateTag(tag, profile);
}
