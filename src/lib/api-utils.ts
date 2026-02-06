import { NextResponse } from "next/server";

export const CACHE_HEADERS = {
  artist: {
    "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
  },
  album: {
    "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
  },
  search: {
    "Cache-Control": "public, s-maxage=1800, stale-while-revalidate=3600",
  },
  image: {
    "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=604800",
  },
} as const;

export function successResponse<T>(
  data: T,
  cacheType: keyof typeof CACHE_HEADERS = "artist",
): NextResponse {
  return NextResponse.json(data, {
    headers: CACHE_HEADERS[cacheType],
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
  retries: number = 2,
): Promise<NextResponse> {
  let lastError: unknown;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const data = await fetcher();
      return successResponse(data, cacheType);
    } catch (error) {
      lastError = error;
      if (attempt < retries) {
        // Exponential backoff: 300ms, 900ms
        await new Promise((r) => setTimeout(r, 300 * Math.pow(3, attempt)));
      }
    }
  }

  console.error(`${errorMessage} (after ${retries + 1} attempts):`, lastError);
  return errorResponse(errorMessage, 500);
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
