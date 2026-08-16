"use client";

import { useCallback, useEffect, useState } from "react";

import type { AlbumReview, AlbumReviewsResponse } from "@/lib/albumReviews";

export function useAlbumReviews(albumId: string | undefined, enabled: boolean) {
  const [reviews, setReviews] = useState<AlbumReview[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!albumId || !enabled) {
      setReviews([]);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/album-reviews?albumId=${encodeURIComponent(albumId)}`,
      );
      if (!res.ok) throw new Error("Failed to load reviews");
      const data = (await res.json()) as AlbumReviewsResponse;
      setReviews(data.reviews || []);
    } catch (err) {
      console.error(err);
      setError("Could not load reviews");
    } finally {
      setLoading(false);
    }
  }, [albumId, enabled]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const saveReview = useCallback(
    async (body: string) => {
      if (!albumId) throw new Error("Missing album");
      const res = await fetch("/api/album-reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ albumId, body }),
      });
      const data = (await res.json()) as { review?: AlbumReview; error?: string };
      if (!res.ok || !data.review) {
        throw new Error(data.error || "Could not save review");
      }

      setReviews((prev) => {
        const withoutMine = prev.filter((review) => review.id !== data.review!.id);
        return [data.review!, ...withoutMine];
      });
      return data.review;
    },
    [albumId],
  );

  const deleteReview = useCallback(
    async (userId: string) => {
      if (!albumId) throw new Error("Missing album");
      const res = await fetch(
        `/api/album-reviews?albumId=${encodeURIComponent(albumId)}`,
        { method: "DELETE" },
      );
      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        throw new Error(data.error || "Could not delete review");
      }
      setReviews((prev) => prev.filter((review) => review.userId !== userId));
    },
    [albumId],
  );

  return {
    reviews,
    count: reviews.length,
    loading,
    error,
    refresh,
    saveReview,
    deleteReview,
    setReviews,
  };
}
