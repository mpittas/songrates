import { NextResponse } from "next/server";

/**
 * Standard cache headers for API responses
 */
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

/**
 * Creates a successful JSON response with appropriate cache headers
 */
export function successResponse<T>(
  data: T,
  cacheType: keyof typeof CACHE_HEADERS = "artist",
): NextResponse {
  return NextResponse.json(data, {
    headers: CACHE_HEADERS[cacheType],
  });
}

/**
 * Creates an error JSON response
 */
export function errorResponse(
  message: string,
  status: number = 500,
): NextResponse {
  return NextResponse.json({ error: message }, { status });
}

/**
 * Wraps an async API handler with standardized error handling
 */
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

/**
 * Extracts and validates the ID parameter from route params
 */
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
 * Validates that a required parameter exists
 */
export function validateRequiredParam(
  param: string | null,
  paramName: string = "id",
): { valid: boolean; error?: NextResponse } {
  if (!param) {
    return {
      valid: false,
      error: errorResponse(`Missing required parameter: ${paramName}`, 400),
    };
  }
  return { valid: true };
}
