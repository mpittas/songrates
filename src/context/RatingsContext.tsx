"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useMemo,
  useRef,
} from "react";
import { useAuth } from "@/context/AuthContext";
import { createClient } from "@/utils/supabase/client";
import {
  AlbumContext,
  RatedAlbumData,
  PublicAlbumRating,
  PublicTrackRating,
} from "@/types/music";
import { generateUUID } from "@/lib/utils";
import { fetchAllRows } from "@/lib/supabase/fetchAllRows";
import { isFullyRatedAlbum } from "@/lib/albumPageStats";

interface RatingsContextType {
  ratings: Record<string, number>;
  albumRatings: Record<string, RatedAlbumData>;
  publicAlbumRatings: Record<string, PublicAlbumRating>;
  publicTrackRatings: Record<string, PublicTrackRating>;
  ensurePublicAlbumRatings: (albumIds: string[]) => Promise<void>;
  ensurePublicTrackRatings: (trackIds: string[]) => Promise<void>;
  setRating: (
    trackId: string,
    rating: number,
    albumContext?: AlbumContext,
  ) => void;
  getAlbumRating: (albumId: string) => number | null;
  removeAlbumRating: (albumId: string) => Promise<void>;
  syncAlbumTotalTracks: (albumId: string, totalTracks: number) => void;
}

function resolveAlbumTotalTracks(
  incoming: number | undefined,
  existing: number | undefined,
): number {
  if (incoming && incoming > 0) return incoming;
  if (existing && existing > 0) return existing;
  return 0;
}

interface DBPublicAlbumRating {
  album_id: string;
  average_rating: string | number;
  rating_count: number;
}

interface DBPublicTrackRating {
  track_id: string;
  album_id: string;
  average_rating: string | number;
  rating_count: number;
}

const PUBLIC_TRACK_RATING_CHUNK = 200;

function toPublicTrackRating(row: DBPublicTrackRating): PublicTrackRating {
  return {
    trackId: row.track_id,
    albumId: row.album_id,
    averageRating: Number(row.average_rating),
    ratingCount: Number(row.rating_count),
  };
}

interface RealtimePayload<T> {
  eventType: "INSERT" | "UPDATE" | "DELETE";
  new: T;
  old: T;
  schema: string;
  table: string;
  commit_timestamp: string;
  errors: null | unknown[];
}

interface DBRating {
  track_id: string;
  album_id: string;
  rating: number;
}

interface DBUserAlbum {
  album_id: string;
  title: string;
  artist_name: string;
  release_date?: string;
  total_tracks: number;
  created_at?: string;
  thumbnail_url: string | null;
  album_type?: string | null;
}

const RatingsContext = createContext<RatingsContextType | undefined>(undefined);

export function RatingsProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  // Stabilize supabase client instance to prevent effect re-runs
  const [supabase] = useState(() => createClient());

  const [ratings, setRatings] = useState<Record<string, number>>({});
  const [albumRatings, setAlbumRatings] = useState<
    Record<string, RatedAlbumData>
  >({});
  const [publicAlbumRatings, setPublicAlbumRatings] = useState<
    Record<string, PublicAlbumRating>
  >({});
  const [publicTrackRatings, setPublicTrackRatings] = useState<
    Record<string, PublicTrackRating>
  >({});
  const requestedPublicAlbumIdsRef = useRef<Set<string>>(new Set());
  const requestedPublicTrackIdsRef = useRef<Set<string>>(new Set());
  const pendingPublicTrackIdsRef = useRef<Set<string>>(new Set());
  const publicTrackFlushTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const publicTrackDrainPromiseRef = useRef<Promise<void> | null>(null);
  const didSyncTrackCountsRef = useRef(false);
  const albumRatingsRef = useRef(albumRatings);
  albumRatingsRef.current = albumRatings;

  const persistAlbumTotalTracks = useCallback(
    async (
      targetUserId: string,
      patches: { albumId: string; totalTracks: number }[],
    ) => {
      if (patches.length === 0) return;
      await Promise.all(
        patches.map(({ albumId, totalTracks }) =>
          supabase
            .from("user_albums")
            .update({ total_tracks: totalTracks })
            .eq("user_id", targetUserId)
            .eq("album_id", albumId),
        ),
      );
    },
    [supabase],
  );

  const applyAlbumTrackCounts = useCallback(
    (counts: Record<string, number>, persistUserId?: string | null) => {
      const patches: { albumId: string; totalTracks: number }[] = [];
      for (const [albumId, totalTracks] of Object.entries(counts)) {
        const album = albumRatingsRef.current[albumId];
        if (!album || !totalTracks || album.totalTracks === totalTracks) {
          continue;
        }
        patches.push({ albumId, totalTracks });
      }

      if (patches.length === 0) return;

      setAlbumRatings((prev) => {
        const next = { ...prev };
        for (const { albumId, totalTracks } of patches) {
          const album = next[albumId];
          if (!album) continue;
          next[albumId] = { ...album, totalTracks };
        }
        return next;
      });

      if (persistUserId) {
        void persistAlbumTotalTracks(persistUserId, patches);
      }
    },
    [persistAlbumTotalTracks],
  );

  // Fetch from Supabase
  useEffect(() => {
    didSyncTrackCountsRef.current = false;
    // Subscribe to public rating changes, but load initial rows on demand.
    const channel = supabase
      .channel("public_ratings_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "public_album_ratings",
        },
        (payload: RealtimePayload<DBPublicAlbumRating>) => {
          if (
            payload.eventType === "INSERT" ||
            payload.eventType === "UPDATE"
          ) {
            const newRecord = payload.new;
            setPublicAlbumRatings((prev) => ({
              ...prev,
              [newRecord.album_id]: {
                albumId: newRecord.album_id,
                averageRating: Number(newRecord.average_rating),
                ratingCount: Number(newRecord.rating_count),
              },
            }));
          } else if (payload.eventType === "DELETE") {
            const oldRecord = payload.old;
            if (oldRecord && oldRecord.album_id) {
              setPublicAlbumRatings((prev) => {
                const next = { ...prev };
                delete next[oldRecord.album_id];
                return next;
              });
            }
          }
        },
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "public_track_ratings",
        },
        (payload: RealtimePayload<DBPublicTrackRating>) => {
          if (
            payload.eventType === "INSERT" ||
            payload.eventType === "UPDATE"
          ) {
            const newRecord = payload.new;
            if (!newRecord?.track_id) return;
            requestedPublicTrackIdsRef.current.add(newRecord.track_id);
            setPublicTrackRatings((prev) => ({
              ...prev,
              [newRecord.track_id]: toPublicTrackRating(newRecord),
            }));
          } else if (payload.eventType === "DELETE") {
            const oldRecord = payload.old;
            if (oldRecord && oldRecord.track_id) {
              setPublicTrackRatings((prev) => {
                if (!(oldRecord.track_id in prev)) return prev;
                const next = { ...prev };
                delete next[oldRecord.track_id];
                return next;
              });
            }
          }
        },
      )
      .subscribe();

    const storedGuestId = localStorage.getItem("songrates_guest_id");

    if (!user && !storedGuestId) {
      const newGuestId = generateUUID();
      localStorage.setItem("songrates_guest_id", newGuestId);
      Promise.resolve().then(() => {
        setRatings({});
        setAlbumRatings({});
      });
      return () => {
        supabase.removeChannel(channel);
      };
    }

    const effectiveUserId = user?.id || storedGuestId;
    if (!effectiveUserId) {
      Promise.resolve().then(() => {
        setRatings({});
        setAlbumRatings({});
      });
      return () => {
        supabase.removeChannel(channel);
      };
    }

    const fetchPersonalData = async () => {
      try {
        const [ratingsResult, albumsResult] = await Promise.all([
          fetchAllRows<DBRating>((from, to) =>
            supabase
              .from("ratings")
              .select("track_id, album_id, rating")
              .eq("user_id", effectiveUserId)
              .range(from, to),
          ),
          fetchAllRows<DBUserAlbum>((from, to) =>
            supabase
              .from("user_albums")
              .select(
                "album_id, title, artist_name, release_date, total_tracks, created_at, thumbnail_url, album_type",
              )
              .eq("user_id", effectiveUserId)
              .range(from, to),
          ),
        ]);

        if (ratingsResult.error) throw ratingsResult.error;
        if (albumsResult.error) throw albumsResult.error;

        const newRatings: Record<string, number> = {};
        const albumTracksMap: Record<string, string[]> = {};

        ratingsResult.rows.forEach((r) => {
          const value = Number(r.rating);
          newRatings[r.track_id] = value;

          if (value > 0) {
            if (!albumTracksMap[r.album_id]) {
              albumTracksMap[r.album_id] = [];
            }
            albumTracksMap[r.album_id].push(r.track_id);
          }
        });
        setRatings(newRatings);

        const newAlbumRatings: Record<string, RatedAlbumData> = {};
        albumsResult.rows.forEach((a) => {
          newAlbumRatings[a.album_id] = {
            id: a.album_id,
            title: a.title,
            artistName: a.artist_name,
            releaseDate: a.release_date,
            totalTracks: a.total_tracks,
            ratedTrackIds: albumTracksMap[a.album_id] || [],
            ratedAt: a.created_at,
            artworkUrl: a.thumbnail_url || undefined,
            albumType: a.album_type || undefined,
          };
        });
        setAlbumRatings(newAlbumRatings);

        const albumIds = Object.keys(newAlbumRatings);
        if (albumIds.length > 0 && !didSyncTrackCountsRef.current) {
          didSyncTrackCountsRef.current = true;
          void (async () => {
            try {
              const counts: Record<string, number> = {};
              const chunkSize = 240;
              for (let i = 0; i < albumIds.length; i += chunkSize) {
                const res = await fetch("/api/album-track-counts", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    ids: albumIds.slice(i, i + chunkSize),
                  }),
                });
                if (!res.ok) continue;
                const data = (await res.json()) as {
                  counts?: Record<string, number>;
                };
                Object.assign(counts, data.counts);
              }
              if (Object.keys(counts).length > 0) {
                applyAlbumTrackCounts(counts, effectiveUserId);
              }
            } catch (syncError) {
              console.error("Failed to sync album track counts", syncError);
            }
          })();
        }
      } catch (e) {
        console.error("Failed to load ratings from Supabase", e);
      }
    };

    const scheduleFetch = () => {
      if (typeof requestIdleCallback !== "undefined") {
        const idleId = requestIdleCallback(() => fetchPersonalData(), {
          timeout: 2500,
        });
        return () => cancelIdleCallback(idleId);
      }
      const timeoutId = window.setTimeout(fetchPersonalData, 0);
      return () => window.clearTimeout(timeoutId);
    };

    const cancelScheduledFetch = scheduleFetch();

    return () => {
      cancelScheduledFetch();
      supabase.removeChannel(channel);
    };

    // Only fetch when user changes, supabase is now stable
  }, [user, supabase, applyAlbumTrackCounts]);

  const ensurePublicAlbumRatings = useCallback(
    async (albumIds: string[]) => {
      const missingIds = Array.from(
        new Set(albumIds.filter((id) => !requestedPublicAlbumIdsRef.current.has(id))),
      );
      if (missingIds.length === 0) return;

      const { data, error } = await supabase
        .from("public_album_ratings")
        .select("album_id, average_rating, rating_count")
        .in("album_id", missingIds);

      if (error) {
        console.error("Error fetching public ratings:", error);
        return;
      }

      missingIds.forEach((id) => requestedPublicAlbumIdsRef.current.add(id));

      const newPublicRatings: Record<string, PublicAlbumRating> = {};
      for (const row of (data || []) as DBPublicAlbumRating[]) {
        newPublicRatings[row.album_id] = {
          albumId: row.album_id,
          averageRating: Number(row.average_rating),
          ratingCount: Number(row.rating_count),
        };
      }

      if (Object.keys(newPublicRatings).length > 0) {
        setPublicAlbumRatings((prev) => ({ ...prev, ...newPublicRatings }));
      }
    },
    [supabase],
  );

  const applyPublicTrackRatingRows = useCallback(
    (rows: DBPublicTrackRating[]) => {
      if (rows.length === 0) return;
      const next: Record<string, PublicTrackRating> = {};
      for (const row of rows) {
        requestedPublicTrackIdsRef.current.add(row.track_id);
        next[row.track_id] = toPublicTrackRating(row);
      }
      setPublicTrackRatings((prev) => ({ ...prev, ...next }));
    },
    [],
  );

  const refreshPublicTrackRating = useCallback(
    async (trackId: string) => {
      if (!trackId) return;

      const { data, error } = await supabase
        .from("public_track_ratings")
        .select("track_id, album_id, average_rating, rating_count")
        .eq("track_id", trackId)
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error("Error refreshing public track rating:", error);
        return;
      }

      requestedPublicTrackIdsRef.current.add(trackId);
      if (!data) {
        setPublicTrackRatings((prev) => {
          if (!(trackId in prev)) return prev;
          const next = { ...prev };
          delete next[trackId];
          return next;
        });
        return;
      }

      setPublicTrackRatings((prev) => ({
        ...prev,
        [trackId]: toPublicTrackRating(data as DBPublicTrackRating),
      }));
    },
    [supabase],
  );

  const flushPublicTrackRatings = useCallback(async () => {
    const ids = Array.from(pendingPublicTrackIdsRef.current);
    pendingPublicTrackIdsRef.current.clear();
    if (ids.length === 0) return;

    for (let i = 0; i < ids.length; i += PUBLIC_TRACK_RATING_CHUNK) {
      const chunk = ids.slice(i, i + PUBLIC_TRACK_RATING_CHUNK);
      const { data, error } = await supabase
        .from("public_track_ratings")
        .select("track_id, album_id, average_rating, rating_count")
        .in("track_id", chunk);

      if (error) {
        console.error("Error fetching public track ratings:", error);
        chunk.forEach((id) => requestedPublicTrackIdsRef.current.delete(id));
        continue;
      }

      applyPublicTrackRatingRows((data || []) as DBPublicTrackRating[]);
    }
  }, [applyPublicTrackRatingRows, supabase]);

  const ensurePublicTrackRatings = useCallback(
    (trackIds: string[]) => {
      for (const id of trackIds) {
        if (!id || requestedPublicTrackIdsRef.current.has(id)) continue;
        requestedPublicTrackIdsRef.current.add(id);
        pendingPublicTrackIdsRef.current.add(id);
      }

      if (pendingPublicTrackIdsRef.current.size === 0) {
        return publicTrackDrainPromiseRef.current ?? Promise.resolve();
      }

      if (!publicTrackDrainPromiseRef.current) {
        publicTrackDrainPromiseRef.current = new Promise<void>((resolve) => {
          publicTrackFlushTimerRef.current = setTimeout(() => {
            publicTrackFlushTimerRef.current = null;
            void (async () => {
              try {
                while (pendingPublicTrackIdsRef.current.size > 0) {
                  await flushPublicTrackRatings();
                }
              } finally {
                publicTrackDrainPromiseRef.current = null;
                resolve();
              }
            })();
          }, 0);
        });
      }

      return publicTrackDrainPromiseRef.current;
    },
    [flushPublicTrackRatings],
  );

  useEffect(() => {
    return () => {
      if (publicTrackFlushTimerRef.current != null) {
        clearTimeout(publicTrackFlushTimerRef.current);
      }
    };
  }, []);

  const setRating = useCallback(
    async (trackId: string, rating: number, albumContext?: AlbumContext) => {
      // Optimistic Update
      setRatings((prev) => {
        if (prev[trackId] === rating) return prev;
        return { ...prev, [trackId]: rating };
      });

      if (albumContext) {
        setAlbumRatings((prev) => {
          const currentAlbum = prev[albumContext.albumId] || {
            id: albumContext.albumId,
            title: albumContext.title,
            artistName: albumContext.artistName,
            releaseDate: albumContext.releaseDate,
            totalTracks: 0,
            artworkUrl: albumContext.artworkUrl,
            albumType: albumContext.albumType,
            ratedTrackIds: [],
          };

          let newRatedTrackIds = [...currentAlbum.ratedTrackIds];

          if (rating > 0) {
            if (!newRatedTrackIds.includes(trackId)) {
              newRatedTrackIds.push(trackId);
            }
          } else {
            newRatedTrackIds = newRatedTrackIds.filter((id) => id !== trackId);
          }

          const totalTracks = resolveAlbumTotalTracks(
            albumContext.totalTracks,
            currentAlbum.totalTracks,
          );

          return {
            ...prev,
            [albumContext.albumId]: {
              ...currentAlbum,
              title: albumContext.title,
              artistName: albumContext.artistName,
              releaseDate: albumContext.releaseDate,
              totalTracks,
              artworkUrl: albumContext.artworkUrl || currentAlbum.artworkUrl,
              albumType: albumContext.albumType || currentAlbum.albumType,
              ratedTrackIds: newRatedTrackIds,
              ratedAt: currentAlbum.ratedAt || new Date().toISOString(),
            },
          };
        });
      }

      // Determine Target User ID (Auth or Guest)
      const targetUserId =
        user?.id || localStorage.getItem("songrates_guest_id");

      if (!targetUserId) {
        console.error("No user ID or guest ID found, cannot save rating.");
        return;
      }

      // Supabase Calls
      if (rating > 0) {
        if (!albumContext) {
          console.warn(
            "Missing albumContext for setRating, cannot save complete data to Supabase",
          );
          return;
        }

        const { error: rError } = await supabase.from("ratings").upsert({
          user_id: targetUserId,
          track_id: trackId,
          album_id: albumContext.albumId,
          rating: rating,
        });

        if (rError) {
          console.error(
            "Error saving rating to Supabase:",
            rError.message,
            rError.code,
            rError.details,
            rError.hint,
          );
        } else {
          void refreshPublicTrackRating(trackId);
        }

        const albumType = albumContext.albumType?.trim();
        const albumRow = {
          user_id: targetUserId,
          album_id: albumContext.albumId,
          title: albumContext.title,
          artist_name: albumContext.artistName,
          release_date: albumContext.releaseDate,
          thumbnail_url: albumContext.artworkUrl || null,
          total_tracks: resolveAlbumTotalTracks(
            albumContext.totalTracks,
            albumRatingsRef.current[albumContext.albumId]?.totalTracks,
          ),
          ...(albumType ? { album_type: albumType } : {}),
        };

        const { error: aError } = await supabase
          .from("user_albums")
          .upsert(albumRow);

        if (aError) {
          console.error("Error saving album to Supabase", aError);
        }
      } else {
        // Delete rating
        const { error } = await supabase.from("ratings").delete().match({
          user_id: targetUserId,
          track_id: trackId,
        });

        if (error) {
          console.error("Error deleting rating from Supabase", error);
        } else {
          void refreshPublicTrackRating(trackId);
        }
      }
    },
    [user, supabase, refreshPublicTrackRating],
  );

  const getAlbumRating = useCallback(
    (albumId: string) => {
      const album = albumRatings[albumId];
      if (!album || album.ratedTrackIds.length === 0) return null;

      if (!isFullyRatedAlbum(album.ratedTrackIds.length, album.totalTracks)) {
        return null;
      }

      let total = 0;
      let count = 0;
      for (const trackId of album.ratedTrackIds) {
        if (ratings[trackId]) {
          total += ratings[trackId];
          count++;
        }
      }

      return count > 0 ? total / count : null;
    },
    [albumRatings, ratings],
  );

  const removeAlbumRating = useCallback(
    async (albumId: string) => {
      // Optimistic Update
      const album = albumRatings[albumId];
      if (!album) return;

      const trackIdsToRemove = album.ratedTrackIds;

      setRatings((prev) => {
        const next = { ...prev };
        trackIdsToRemove.forEach((id) => delete next[id]);
        return next;
      });

      setAlbumRatings((prev) => {
        const next = { ...prev };
        // We might want to keep the album data but clear rating info,
        // OR completely remove it from "user_albums" if that's the intention.
        // Based on "fully remove rating", removing it from our tracked albums makes sense
        // if it has no ratings left.
        // However, user_albums is "albums the user has interacted with".
        // Let's keep the album record but clear its rated tracks.
        // Actually, if we remove all ratings, it shouldn't show up in "Rated" page anymore.
        // The "Rated" page filters by `ratiodTrackIds.length > 0`.
        if (next[albumId]) {
          next[albumId] = {
            ...next[albumId],
            ratedTrackIds: [],
          };
        }
        return next;
      });

      if (!user) return;

      try {
        // Delete ratings from Supabase
        const { error: rError } = await supabase
          .from("ratings")
          .delete()
          .match({ album_id: albumId, user_id: user.id });

        if (rError) {
          console.error("Error deleting album ratings from Supabase", rError);
        }

        // We might also want to update or delete the user_albums entry depending on logic.
        // If the album has no other significance (like "listened to" or "owned"),
        // we might leave it or update its stats.
        // For now, let's just update the user_albums entry to have 0 rated tracks?
        // Actually, trigger in DB might handle it, or we should update it.
        // Simplest is to just delete the ratings.

        // Let's also update the user_albums "manual" fields if we track them manually.
        // It seems user_albums is upserted on rating.
        // If we remove all ratings, we might want to delete the user_albums entry
        // OR keep it but with different status.
        // To strictly "remove rating", ensuring track_ids are gone is enough
        // relative to the "Rated" page logic I saw earlier.
      } catch (e) {
        console.error("Failed to remove album rating", e);
      }
    },
    [user, supabase, albumRatings],
  );

  const syncAlbumTotalTracks = useCallback(
    (albumId: string, totalTracks: number) => {
      if (!albumId || !totalTracks) return;
      applyAlbumTrackCounts(
        { [albumId]: totalTracks },
        user?.id ||
          (typeof window !== "undefined"
            ? localStorage.getItem("songrates_guest_id")
            : null),
      );
    },
    [applyAlbumTrackCounts, user?.id],
  );

  const value = useMemo(
    () => ({
      ratings,
      setRating,
      albumRatings,
      publicAlbumRatings,
      publicTrackRatings,
      ensurePublicAlbumRatings,
      ensurePublicTrackRatings,
      getAlbumRating,
      removeAlbumRating,
      syncAlbumTotalTracks,
    }),
    [
      ratings,
      setRating,
      albumRatings,
      publicAlbumRatings,
      publicTrackRatings,
      ensurePublicAlbumRatings,
      ensurePublicTrackRatings,
      getAlbumRating,
      removeAlbumRating,
      syncAlbumTotalTracks,
    ],
  );

  return (
    <RatingsContext.Provider
      value={value}
    >
      {children}
    </RatingsContext.Provider>
  );
}

export function useRatingsContext() {
  const context = useContext(RatingsContext);
  if (context === undefined) {
    throw new Error("useRatingsContext must be used within a RatingsProvider");
  }
  return context;
}
