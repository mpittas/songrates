"use client";

import { useEffect, useMemo, useRef, useState } from "react";

/**
 * Looks up Apple Music track counts for album IDs so fully/partially rated
 * filters are not fooled by placeholder totals (e.g. 1) stored on user_albums.
 */
export function useAlbumTrackCounts(albumIds: string[]) {
  const [counts, setCounts] = useState<Record<string, number>>({});
  const fetchedIdsRef = useRef(new Set<string>());
  const idsKey = useMemo(
    () => [...new Set(albumIds.filter(Boolean))].sort().join(","),
    [albumIds],
  );

  useEffect(() => {
    const ids = idsKey ? idsKey.split(",") : [];
    const missing = ids.filter((id) => !fetchedIdsRef.current.has(id));
    if (missing.length === 0) return;

    let cancelled = false;
    missing.forEach((id) => fetchedIdsRef.current.add(id));

    const load = async () => {
      try {
        const res = await fetch("/api/album-track-counts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ids: missing }),
        });
        if (!res.ok) return;
        const data = (await res.json()) as { counts?: Record<string, number> };
        if (cancelled || !data.counts) return;
        setCounts((prev) => ({ ...prev, ...data.counts }));
      } catch (error) {
        console.error("Failed to load album track counts", error);
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [idsKey]);

  return counts;
}
