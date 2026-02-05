"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import { useAuth } from "@/context/AuthContext";
import { createClient } from "@/utils/supabase/client";
import { AlbumContext, RatedAlbumData, PublicAlbumRating } from "@/types/music";

interface RatingsContextType {
  ratings: Record<string, number>;
  albumRatings: Record<string, RatedAlbumData>;
  publicAlbumRatings: Record<string, PublicAlbumRating>;
  setRating: (
    trackId: string,
    rating: number,
    albumContext?: AlbumContext,
  ) => void;
  getAlbumRating: (albumId: string) => number | null;
  removeAlbumRating: (albumId: string) => Promise<void>;
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
  const [isLoaded, setIsLoaded] = useState(false);

  // Fetch from Supabase
  useEffect(() => {
    // 1. Fetch Public Ratings (Always, or at least independent of user)
    const fetchPublicRatings = async () => {
      const { data: dbPublicRatings, error: pError } = await supabase
        .from("public_album_ratings")
        .select("*");

      if (pError) {
        console.error("Error fetching public ratings:", pError);
      } else {
        const newPublicRatings: Record<string, PublicAlbumRating> = {};
        if (dbPublicRatings) {
          dbPublicRatings.forEach((r) => {
            newPublicRatings[r.album_id] = {
              albumId: r.album_id,
              averageRating: Number(r.average_rating),
              ratingCount: Number(r.rating_count),
            };
          });
        }
        setPublicAlbumRatings(newPublicRatings);
      }
    };

    fetchPublicRatings();

    // 2. Subscribe to Realtime Changes for Public Ratings
    const channel = supabase
      .channel("public_ratings_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "public_album_ratings",
        },
        (payload) => {
          // console.log("Realtime event received:", payload);
          if (
            payload.eventType === "INSERT" ||
            payload.eventType === "UPDATE"
          ) {
            const newRecord = payload.new as any;
            setPublicAlbumRatings((prev) => ({
              ...prev,
              [newRecord.album_id]: {
                albumId: newRecord.album_id,
                averageRating: Number(newRecord.average_rating),
                ratingCount: Number(newRecord.rating_count),
              },
            }));
          } else if (payload.eventType === "DELETE") {
            const oldRecord = payload.old as any;
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
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          // console.log("Subscribed to public ratings changes");
        }
      });

    // 3. Fetch Personal Ratings (User or Guest)
    const activeUserId = user?.id || localStorage.getItem("songrates_guest_id");

    // Generate guest ID if needed
    if (!user && !activeUserId) {
      const newGuestId = crypto.randomUUID();
      localStorage.setItem("songrates_guest_id", newGuestId);
    }

    // Stabilize the ID we use for this effect run
    const effectiveUserId =
      user?.id || localStorage.getItem("songrates_guest_id");

    if (!effectiveUserId) {
      // Should not happen if we just set it, but safety
      setRatings({});
      setAlbumRatings({});
      setIsLoaded(true);
      return () => {
        supabase.removeChannel(channel);
      };
    }

    const fetchPersonalData = async () => {
      try {
        // Fetch ratings
        const { data: dbRatings, error: rError } = await supabase
          .from("ratings")
          .select("track_id, album_id, rating")
          .eq("user_id", effectiveUserId);

        if (rError) throw rError;

        // Fetch albums
        const { data: dbAlbums, error: aError } = await supabase
          .from("user_albums")
          .select("*")
          .eq("user_id", effectiveUserId);

        if (aError) throw aError;

        const newRatings: Record<string, number> = {};
        // Group track IDs by album for easier construction
        const albumTracksMap: Record<string, string[]> = {};

        if (dbRatings) {
          dbRatings.forEach((r) => {
            newRatings[r.track_id] = Number(r.rating);

            if (!albumTracksMap[r.album_id]) {
              albumTracksMap[r.album_id] = [];
            }
            albumTracksMap[r.album_id].push(r.track_id);
          });
        }
        setRatings(newRatings);

        const newAlbumRatings: Record<string, RatedAlbumData> = {};
        if (dbAlbums) {
          dbAlbums.forEach((a) => {
            newAlbumRatings[a.album_id] = {
              id: a.album_id,
              title: a.title,
              artistName: a.artist_name,
              releaseDate: a.release_date,
              totalTracks: a.total_tracks,
              ratedTrackIds: albumTracksMap[a.album_id] || [],
              ratedAt: a.created_at,
            };
          });
        }
        setAlbumRatings(newAlbumRatings);
      } catch (e) {
        console.error("Failed to load ratings from Supabase", e);
      } finally {
        setIsLoaded(true);
      }
    };

    fetchPersonalData();

    return () => {
      supabase.removeChannel(channel);
    };

    // Only fetch when user changes, supabase is now stable
  }, [user, supabase]);

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
            totalTracks: albumContext.totalTracks,
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

          return {
            ...prev,
            [albumContext.albumId]: {
              ...currentAlbum,
              title: albumContext.title,
              artistName: albumContext.artistName,
              releaseDate: albumContext.releaseDate,
              totalTracks: albumContext.totalTracks,
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
          console.error("Error saving rating to Supabase", rError);
        }

        const { error: aError } = await supabase.from("user_albums").upsert({
          user_id: targetUserId,
          album_id: albumContext.albumId,
          title: albumContext.title,
          artist_name: albumContext.artistName,
          release_date: albumContext.releaseDate,
          total_tracks: albumContext.totalTracks,
        });

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
        }
      }
    },
    [user, supabase],
  );

  const getAlbumRating = useCallback(
    (albumId: string) => {
      const album = albumRatings[albumId];
      if (!album || album.ratedTrackIds.length === 0) return null;

      if (album.ratedTrackIds.length < album.totalTracks) return null;

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

  return (
    <RatingsContext.Provider
      value={{
        ratings,
        setRating,
        albumRatings,
        publicAlbumRatings,
        getAlbumRating,
        removeAlbumRating,
      }}
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
