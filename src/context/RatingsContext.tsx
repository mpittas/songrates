"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";

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
  const [ratings, setRatings] = useState<Record<string, number>>({});
  const [albumRatings, setAlbumRatings] = useState<
    Record<string, RatedAlbumData>
  >({});
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from localStorage
  useEffect(() => {
    const loadRatings = () => {
      try {
        const storedRatings = localStorage.getItem("song_ratings");
        const storedAlbums = localStorage.getItem("album_ratings");

        if (storedRatings) {
          const parsedRatings = JSON.parse(storedRatings);
          if (parsedRatings && typeof parsedRatings === "object") {
            setRatings(parsedRatings);
          }
        }

        if (storedAlbums) {
          const parsedAlbums = JSON.parse(storedAlbums);
          if (parsedAlbums && typeof parsedAlbums === "object") {
            setAlbumRatings(parsedAlbums);
          }
        }
      } catch (e) {
        console.error("Failed to load ratings from localStorage", e);
      }
    };

    loadRatings();
    setIsLoaded(true);

    const handleStorageChange = (e: StorageEvent) => {
      try {
        if (e.key === "song_ratings" && e.newValue) {
          const parsed = JSON.parse(e.newValue);
          if (parsed && typeof parsed === "object") {
            setRatings(parsed);
          }
        }
        if (e.key === "album_ratings" && e.newValue) {
          const parsed = JSON.parse(e.newValue);
          if (parsed && typeof parsed === "object") {
            setAlbumRatings(parsed);
          }
        }
      } catch (err) {
        console.error("Failed to parse storage update", err);
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  // Save to localStorage
  useEffect(() => {
    if (!isLoaded) return;
    localStorage.setItem("song_ratings", JSON.stringify(ratings));
    localStorage.setItem("album_ratings", JSON.stringify(albumRatings));
  }, [ratings, albumRatings, isLoaded]);

  const setRating = useCallback(
    (trackId: string, rating: number, albumContext?: AlbumContext) => {
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
    },
    [],
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
