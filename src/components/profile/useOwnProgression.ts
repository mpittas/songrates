"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRatingsContext } from "@/context/RatingsContext";
import { createClient } from "@/utils/supabase/client";
import {
  EMPTY_PROGRESSION,
  getProgressionView,
  incompleteAlbumsForProgress,
  progressionFromRow,
  xpFromRatedAlbums,
  type UserProgression,
  type UserProgressionRow,
} from "@/lib/profileProgression";

export function useOwnProgression() {
  const { user } = useAuth();
  const { albumRatings } = useRatingsContext();
  const [stored, setStored] = useState<UserProgression>(EMPTY_PROGRESSION);

  useEffect(() => {
    if (!user) return;

    const supabase = createClient();
    void supabase
      .from("user_progression")
      .select("xp, level, fully_rated_count, review_count")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }: { data: UserProgressionRow | null }) => {
        if (!data) {
          setStored(EMPTY_PROGRESSION);
          return;
        }
        setStored(progressionFromRow(data));
      });
  }, [user]);

  const albums = useMemo(() => Object.values(albumRatings), [albumRatings]);

  const view = useMemo(() => {
    if (albums.length > 0) {
      const live = xpFromRatedAlbums(albums);
      return getProgressionView(
        live.fullyRatedCount,
        stored.reviewCount,
        live.xp,
      );
    }
    return getProgressionView(
      stored.fullyRatedCount,
      stored.reviewCount,
      stored.xp,
    );
  }, [albums, stored]);

  const incompleteAlbums = useMemo(
    () => incompleteAlbumsForProgress(albums),
    [albums],
  );

  return { view, incompleteAlbums };
}
