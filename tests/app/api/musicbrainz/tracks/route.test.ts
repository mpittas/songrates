/**
 * @jest-environment node
 */
import { GET } from "@/app/api/musicbrainz/tracks/route";
import { NextRequest } from "next/server";

global.fetch = jest.fn();

describe("GET /api/musicbrainz/tracks", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return empty tracks if albumId is missing", async () => {
    const req = new NextRequest("http://localhost:3000/api/musicbrainz/tracks");
    const res = await GET(req);
    const json = await res.json();
    expect(json.tracks).toEqual([]);
  });

  it("should find oldest release and return its tracks", async () => {
    const mockReleaseGroupData = {
      title: "Test Album",
      releases: [
        { id: "release_latest", date: "2022-01-01" },
        { id: "release_oldest", date: "2000-01-01" },
        { id: "release_middle", date: "2010-01-01" },
      ],
    };

    const mockTracksData = {
      media: [
        {
          tracks: [
            { id: "t1", title: "Track 1", number: "1", length: 1000 },
            { id: "t2", title: "Track 2", number: "2", length: 2000 },
          ],
        },
      ],
    };

    (global.fetch as jest.Mock).mockImplementation((url: string) => {
      // Mock release-group fetch
      if (url.includes("/release-group/rg_123")) {
        return Promise.resolve({
          ok: true,
          json: async () => mockReleaseGroupData,
        });
      }
      // Mock specific release fetch (expecting oldest)
      if (url.includes("/release/release_oldest")) {
        return Promise.resolve({
          ok: true,
          json: async () => mockTracksData,
        });
      }
      return Promise.reject(new Error(`Unknown URL: ${url}`));
    });

    const req = new NextRequest(
      "http://localhost:3000/api/musicbrainz/tracks?albumId=rg_123",
    );
    const res = await GET(req);
    const json = await res.json();

    expect(json.id).toBe("rg_123");
    expect(json.title).toBe("Test Album");
    expect(json.tracks).toHaveLength(2);
    expect(json.tracks[0].title).toBe("Track 1");

    // Verify that it fetched the oldest release
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining("/release/release_oldest?inc=recordings"),
      expect.anything(),
    );
  });

  it("should handle error if fetching release group fails", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      json: async () => ({}),
    });

    const req = new NextRequest(
      "http://localhost:3000/api/musicbrainz/tracks?albumId=rg_123",
    );
    const res = await GET(req);
    const json = await res.json();

    expect(json.tracks).toEqual([]);
  });
});
