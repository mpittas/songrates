"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";

interface RatingsContextType {
  ratings: Record<string, number>;
  setRating: (trackId: string, rating: number) => void;
}

const RatingsContext = createContext<RatingsContextType | undefined>(undefined);

export function RatingsProvider({ children }: { children: React.ReactNode }) {
  const [ratings, setRatings] = useState<Record<string, number>>({});
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from localStorage on mount and listen for changes in other tabs
  useEffect(() => {
    const loadRatings = () => {
      const stored = localStorage.getItem("song_ratings");
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          setRatings(parsed);
        } catch (e) {
          console.error("Failed to parse ratings from localStorage", e);
        }
      }
    };

    loadRatings();
    setIsLoaded(true);

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "song_ratings" && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          setRatings(parsed);
        } catch (err) {
          console.error("Failed to parse storage update", err);
        }
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  // Save to localStorage whenever ratings change, but only after initial load
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem("song_ratings", JSON.stringify(ratings));
    }
  }, [ratings, isLoaded]);

  const setRating = useCallback((trackId: string, rating: number) => {
    setRatings((prev) => ({
      ...prev,
      [trackId]: rating,
    }));
  }, []);

  return (
    <RatingsContext.Provider value={{ ratings, setRating }}>
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
