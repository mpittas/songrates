import Fuse from "fuse.js";

import { Artist } from "@/types/artist";

/**
 * Re-ranks artists using Fuse.js fuzzy matching combined with MusicBrainz popularity.
 * This provides better partial matching and typo tolerance while still prioritizing popular artists.
 */
export function fuzzySearchArtists(artists: Artist[], query: string): Artist[] {
  if (!artists.length || !query.trim()) return artists;

  const fuse = new Fuse(artists, {
    keys: [
      { name: "name", weight: 0.8 },
      { name: "disambiguation", weight: 0.2 },
    ],
    threshold: 0.6, // Increased for better tolerance on short queries
    includeScore: true,
    ignoreLocation: true, // Match anywhere in the string
    minMatchCharLength: 2,
  });

  const results = fuse.search(query);

  // If Fuse.js finds nothing, fall back to original MusicBrainz-ranked list
  if (results.length === 0) {
    return artists;
  }

  // Combine Fuse.js score with MusicBrainz popularity score
  // Fuse score is 0 (perfect) to 1 (worst), so we invert it
  // MusicBrainz score is 0-100
  const rankedResults = results.map((r) => {
    const fuseScore = 1 - (r.score || 0); // Invert: 1 = perfect match
    const mbScore = (r.item.score || 0) / 100; // Normalize to 0-1
    // Combined score: 60% fuzzy match, 40% popularity
    const combinedScore = fuseScore * 0.6 + mbScore * 0.4;
    return { artist: r.item, combinedScore };
  });

  // Sort by combined score (highest first)
  rankedResults.sort((a, b) => b.combinedScore - a.combinedScore);

  return rankedResults.map((r) => r.artist);
}
