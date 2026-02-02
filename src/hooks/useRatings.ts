"use client";

import { useRatingsContext } from "@/context/RatingsContext";

export function useRatings() {
  return useRatingsContext();
}
