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
import { AlbumContext, RatedAlbumData } from "@/types/music";

interface RatingsContextType {
  ratings: Record<string, number>;
  albumRatings: Record<string, RatedAlbumData>;
  setRating: (
    trackId: string,
    rating: number,
    albumContext?: AlbumContext,
  ) => void;
  getAlbumRating: (albumId: string) => number | null;
}

const RatingsContext = createContext<RatingsContextType | undefined>(undefined);

export function RatingsProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const supabase = createClient();
  const [ratings, setRatings] = useState<Record<string, number>>({});
  const [albumRatings, setAlbumRatings] = useState<
    Record<string, RatedAlbumData>
  >({});
  const [isLoaded, setIsLoaded] = useState(false);

  // Fetch from Supabase
  useEffect(() => {
    if (!user) {
      setRatings({});
      setAlbumRatings({});
      setIsLoaded(true);
      return;
    }

    const fetchData = async () => {
      try {
        // Fetch ratings
        const { data: dbRatings, error: rError } = await supabase
          .from("ratings")
          .select("track_id, album_id, rating");

        if (rError) throw rError;

        // Fetch albums
        const { data: dbAlbums, error: aError } = await supabase
          .from("user_albums")
          .select("*");

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

    fetchData();
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
            },
          };
        });
      }

      if (!user) return;

      // Supabase Calls
      if (rating > 0) {
        if (!albumContext) {
          console.warn(
            "Missing albumContext for setRating, cannot save complete data to Supabase",
          );
          return;
        }

        const { error: rError } = await supabase.from("ratings").upsert({
          user_id: user.id,
          track_id: trackId,
          album_id: albumContext.albumId,
          rating: rating,
        });

        if (rError) {
          console.error("Error saving rating to Supabase", rError);
        }

        const { error: aError } = await supabase.from("user_albums").upsert({
          user_id: user.id,
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
          user_id: user.id,
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

  return (
    <RatingsContext.Provider
      value={{ ratings, setRating, albumRatings, getAlbumRating }}
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
