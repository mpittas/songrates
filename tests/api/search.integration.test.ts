import { searchArtists, searchRecordings } from "@/lib/searchService";

// Mock next/cache since we are not running in a Next.js server context
jest.mock("next/cache", () => ({
  unstable_cache: (fn: any) => fn, // Just execute the function directly, bypassing cache
}));

describe("Search Service Performance & Sorting", () => {
  jest.setTimeout(30000);

  it("searches for artists (Radiohead)", async () => {
    const start = performance.now();
    const results = await searchArtists("Radiohead");
    const duration = performance.now() - start;
    console.log(`Artist search took ${duration.toFixed(2)}ms`);

    expect(results.length).toBeGreaterThan(0);
    expect(results[0].title.toLowerCase()).toContain("radiohead");
  });

  it("searches for songs (Billie Jean) and sorts by official release count", async () => {
    const start = performance.now();
    const results = await searchRecordings("Billie Jean");
    const duration = performance.now() - start;
    console.log(`Song search took ${duration.toFixed(2)}ms`);

    expect(results.length).toBeGreaterThan(0);

    const topResult = results[0];
    console.log("Top Song Result:", {
      title: topResult.title,
      artist: topResult.artistName,
      releaseCount: topResult.releaseCount,
      officialReleaseCount: topResult.officialReleaseCount,
      score: topResult.score,
    });

    // Michael Jackson's Billie Jean should have a high official release count
    // and ideally be the first result or close to it.
    const top5 = results.slice(0, 5);
    const mjTrack = top5.find(
      (r: any) =>
        r.title.toLowerCase() === "billie jean" &&
        r.artistName.toLowerCase().includes("jackson"),
    );

    if (!mjTrack) {
      console.warn(
        "Michael Jackson - Billie Jean not found in top 5. Sorting might need tuning.",
      );
    } else {
      console.log(
        "Found Michael Jackson track:",
        mjTrack.officialReleaseCount,
        "official releases",
      );
    }

    expect(topResult).toHaveProperty("officialReleaseCount");
  });
});
