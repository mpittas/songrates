import Fuse from "fuse.js";

import { Artist } from "@/types/artist";

export function fuzzySearchArtists(artists: Artist[], query: string): Artist[] {
  if (!artists.length || !query.trim()) return artists;

  const fuse = new Fuse(artists, {
    keys: [
      { name: "name", weight: 0.8 },
      { name: "disambiguation", weight: 0.2 },
    ],
    threshold: 0.6,
    includeScore: true,
    ignoreLocation: true,
    minMatchCharLength: 2,
  });

  const results = fuse.search(query);

  if (results.length === 0) {
    return artists;
  }

  // MusicBrainz score is 0-100
  const rankedResults = results.map((r) => {
    const fuseScore = 1 - (r.score || 0); // Invert: 1 = perfect match
    const mbScore = (r.item.score || 0) / 100; // Normalize to 0-1
    // Combined score: 60% fuzzy match, 40% popularity
    const combinedScore = fuseScore * 0.6 + mbScore * 0.4;
    return { artist: r.item, combinedScore };
  });

  rankedResults.sort((a, b) => b.combinedScore - a.combinedScore);

  return rankedResults.map((r) => r.artist);
}
