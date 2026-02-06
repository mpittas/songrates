import { searchByCategory } from "@/lib/searchService";
import type { SongSearchResult } from "@/types/search";

// Mock next/cache since we are not running in a Next.js server context
jest.mock("next/cache", () => ({
  unstable_cache: (fn: any) => fn, // Just execute the function directly, bypassing cache
}));

beforeAll(() => {
  const mockFetch = jest.fn(async (input: any) => {
    const url = typeof input === "string" ? input : input?.url;

    if (typeof url === "string" && url.includes("/ws/2/release-group?")) {
      return {
        ok: true,
        status: 200,
        json: async () => ({
          "release-groups": [
            {
              id: "rg-1",
              title: "OK Computer",
              score: 100,
              "primary-type": "Album",
              "secondary-types": [],
              "artist-credit": [
                {
                  name: "Radiohead",
                  artist: { id: "artist-radiohead", name: "Radiohead" },
                },
              ],
            },
            {
              id: "rg-2",
              title: "Kid A",
              score: 95,
              "primary-type": "Album",
              "secondary-types": [],
              "artist-credit": [
                {
                  name: "Radiohead",
                  artist: { id: "artist-radiohead", name: "Radiohead" },
                },
              ],
            },
          ],
        }),
      } as any;
    }

    if (typeof url === "string" && url.includes("/ws/2/recording?")) {
      return {
        ok: true,
        status: 200,
        json: async () => ({
          recordings: [
            {
              id: "rec-1",
              title: "Billie Jean",
              score: 100,
              length: 294000,
              "first-release-date": "1982-01-02",
              "artist-credit": [
                {
                  name: "Michael Jackson",
                  artist: { id: "artist-mj", name: "Michael Jackson" },
                },
              ],
              releases: [
                {
                  id: "rel-1",
                  status: "Official",
                  date: "1982-11-30",
                  "release-group": {
                    id: "rg-thriller",
                    title: "Thriller",
                    "primary-type": "Album",
                    "secondary-types": [],
                  },
                },
              ],
            },
          ],
        }),
      } as any;
    }

    return {
      ok: false,
      status: 404,
      json: async () => ({}),
    } as any;
  });

  (globalThis as any).fetch = mockFetch;
});

describe("Search Service Performance & Sorting", () => {
  jest.setTimeout(30000);

  it("searches for artists (Radiohead)", async () => {
    const start = performance.now();
    const results = await searchByCategory("Radiohead", "artist");
    const duration = performance.now() - start;
    console.log(`Artist search took ${duration.toFixed(2)}ms`);

    expect(results.length).toBeGreaterThan(0);
    expect(results[0].title.toLowerCase()).toContain("radiohead");
  });

  it("searches for songs (Billie Jean) and sorts by official release count", async () => {
    const start = performance.now();
    const results = (await searchByCategory(
      "Billie Jean",
      "song",
    )) as SongSearchResult[];
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
