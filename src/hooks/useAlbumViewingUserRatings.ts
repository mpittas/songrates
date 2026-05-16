"use client";

import { useEffect, useState } from "react";

interface UserRatingRow {
  track_id: string;
  rating: number;
}

export function useAlbumViewingUserRatings(
  albumId: string | undefined,
  userId: string | null,
  fallbackUserName: string | null,
) {
  const [viewingUserRatings, setViewingUserRatings] = useState<Record<
    string,
    number
  > | null>(null);
  const [viewingUserName, setViewingUserName] = useState<string | null>(null);

  useEffect(() => {
    if (!albumId || !userId) {
      setViewingUserRatings(null);
      setViewingUserName(null);
      return;
    }

    let cancelled = false;

    const fetchUserRatings = async () => {
      const { createClient } = await import("@/utils/supabase/client");
      const supabase = createClient();

      const [ratingsResult, profileResult] = await Promise.all([
        supabase
          .from("ratings")
          .select("track_id, rating")
          .eq("user_id", userId)
          .eq("album_id", albumId),
        supabase.from("profiles").select("username").eq("id", userId).single(),
      ]);

      if (cancelled) return;

      if (ratingsResult.data) {
        const map: Record<string, number> = {};
        ratingsResult.data.forEach((r: unknown) => {
          const row = r as UserRatingRow;
          map[row.track_id] = Number(row.rating);
        });
        setViewingUserRatings(map);
      }

      const freshName = profileResult.data?.username;
      setViewingUserName(freshName || fallbackUserName || null);
    };

    fetchUserRatings();
    return () => {
      cancelled = true;
    };
  }, [albumId, userId, fallbackUserName]);

  return { viewingUserRatings, viewingUserName };
}
