"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getQueryClient } from "@/lib/queryClient";

// Artist data fetching keys
export const artistKeys = {
  all: ["artists"] as const,
  detail: (id: string) => [...artistKeys.all, id] as const,
  albums: (id: string) => [...artistKeys.all, id, "albums"] as const,
  otherReleases: (id: string) =>
    [...artistKeys.all, id, "otherReleases"] as const,
};

// Fetch artist data from API
async function fetchArtistData(artistId: string) {
  const res = await fetch(`/api/artist/${artistId}/data`);
  if (!res.ok) throw new Error("Failed to fetch artist data");
  return res.json();
}

// Fetch artist albums from API
async function fetchArtistAlbums(artistId: string) {
  const res = await fetch(`/api/artist/${artistId}/albums`);
  if (!res.ok) throw new Error("Failed to fetch albums");
  return res.json();
}

// Fetch other releases from API
async function fetchOtherReleases(artistId: string) {
  const res = await fetch(`/api/artist/${artistId}/releases`);
  if (!res.ok) throw new Error("Failed to fetch releases");
  return res.json();
}

// Hook for artist data
export function useArtistData(artistId: string) {
  return useQuery({
    queryKey: artistKeys.detail(artistId),
    queryFn: () => fetchArtistData(artistId),
    enabled: !!artistId,
  });
}

// Hook for artist albums
export function useArtistAlbums(artistId: string) {
  return useQuery({
    queryKey: artistKeys.albums(artistId),
    queryFn: () => fetchArtistAlbums(artistId),
    enabled: !!artistId,
  });
}

// Hook for other releases
export function useOtherReleases(artistId: string) {
  return useQuery({
    queryKey: artistKeys.otherReleases(artistId),
    queryFn: () => fetchOtherReleases(artistId),
    enabled: !!artistId,
  });
}

// Prefetch artist data on hover
export function usePrefetchArtist() {
  const queryClient = useQueryClient();

  return (artistId: string) => {
    // Prefetch all artist data in parallel
    queryClient.prefetchQuery({
      queryKey: artistKeys.detail(artistId),
      queryFn: () => fetchArtistData(artistId),
      staleTime: 5 * 60 * 1000,
    });

    queryClient.prefetchQuery({
      queryKey: artistKeys.albums(artistId),
      queryFn: () => fetchArtistAlbums(artistId),
      staleTime: 5 * 60 * 1000,
    });

    queryClient.prefetchQuery({
      queryKey: artistKeys.otherReleases(artistId),
      queryFn: () => fetchOtherReleases(artistId),
      staleTime: 5 * 60 * 1000,
    });
  };
}

// Standalone prefetch function (for use outside React components)
export function prefetchArtist(artistId: string) {
  const queryClient = getQueryClient();

  return Promise.all([
    queryClient.prefetchQuery({
      queryKey: artistKeys.detail(artistId),
      queryFn: () => fetchArtistData(artistId),
      staleTime: 5 * 60 * 1000,
    }),
    queryClient.prefetchQuery({
      queryKey: artistKeys.albums(artistId),
      queryFn: () => fetchArtistAlbums(artistId),
      staleTime: 5 * 60 * 1000,
    }),
    queryClient.prefetchQuery({
      queryKey: artistKeys.otherReleases(artistId),
      queryFn: () => fetchOtherReleases(artistId),
      staleTime: 5 * 60 * 1000,
    }),
  ]);
}
