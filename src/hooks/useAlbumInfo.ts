"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getQueryClient } from "@/lib/queryClient";
import type { AlbumInfo } from "@/types/music";

// ─── Query Keys ─────────────────────────────────────────────────────────────────

export const albumKeys = {
  all: ["albums"] as const,
  detail: (slug: string) => [...albumKeys.all, slug] as const,
};

// ─── Fetcher ────────────────────────────────────────────────────────────────────

async function fetchAlbumInfo(slug: string): Promise<AlbumInfo> {
  const res = await fetch(`/api/album-info?id=${encodeURIComponent(slug)}`);
  if (!res.ok) throw new Error("Album not found");
  return res.json();
}

// ─── Hook ───────────────────────────────────────────────────────────────────────

/**
 * Fetches album info with React Query caching.
 * Revisiting the same album is instant (served from cache).
 *
 * - staleTime: 10 min (won't refetch if data is fresh)
 * - gcTime: 1 hour (keeps data in memory for instant revisits)
 */
export function useAlbumInfo(
  slug: string | undefined,
  initialData?: AlbumInfo | null,
) {
  return useQuery<AlbumInfo>({
    queryKey: albumKeys.detail(slug || ""),
    queryFn: () => fetchAlbumInfo(slug!),
    enabled: !!slug && initialData === undefined,
    initialData: initialData ?? undefined,

    staleTime: 6 * 60 * 60 * 1000,
    gcTime: 12 * 60 * 60 * 1000,

    refetchOnWindowFocus: false,
    retry: initialData === null ? false : 1,
  });
}

// ─── Prefetch (for hover/link preloading) ───────────────────────────────────────

/**
 * Returns a function to prefetch album data on hover.
 * When the user clicks through, the data is already cached.
 */
export function usePrefetchAlbum() {
  const queryClient = useQueryClient();

  return (slug: string) => {
    queryClient.prefetchQuery({
      queryKey: albumKeys.detail(slug),
      queryFn: () => fetchAlbumInfo(slug),
      staleTime: 6 * 60 * 60 * 1000,
    });
  };
}

/**
 * Standalone prefetch (for use outside React components, e.g. in Link onMouseEnter).
 */
export function prefetchAlbum(slug: string) {
  const queryClient = getQueryClient();

  return queryClient.prefetchQuery({
    queryKey: albumKeys.detail(slug),
    queryFn: () => fetchAlbumInfo(slug),
    staleTime: 6 * 60 * 60 * 1000,
  });
}
