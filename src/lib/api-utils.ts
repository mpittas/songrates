import { NextResponse } from "next/server";

export const CACHE_HEADERS = {
  artist: {
    "Cache-Control": "public, s-maxage=43200, stale-while-revalidate=604800",
  },
  album: {
    "Cache-Control": "public, s-maxage=43200, stale-while-revalidate=604800",
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
