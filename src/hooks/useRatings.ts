"use client";

import { useEffect, useState } from "react";

export function useRatings() {
  const [ratings, setRatings] = useState<Record<string, number>>({});

  useEffect(() => {
    const stored = localStorage.getItem("song_ratings");
    if (stored) {
      setRatings(JSON.parse(stored));
    }
  }, []);

  const setRating = (trackId: string, rating: number) => {
    const newRatings = { ...ratings, [trackId]: rating };
    setRatings(newRatings);
    localStorage.setItem("song_ratings", JSON.stringify(newRatings));
  };

  return { ratings, setRating };
}
