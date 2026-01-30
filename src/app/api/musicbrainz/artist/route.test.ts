/**
 * @jest-environment node
 */
import { GET } from "./route";
import { NextRequest } from "next/server";

global.fetch = jest.fn();

describe("GET /api/musicbrainz/artist", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return empty artists if query is missing (and no id)", async () => {
    const req = new NextRequest("http://localhost:3000/api/musicbrainz/artist");
    const res = await GET(req);
    // Since id is missing, it falls through to query check
    // "if (!query || query.trim().length < 2) return { artists: [] }"
    const json = await res.json();
    expect(json.artists).toEqual([]);
  });

  it("should return artist by id", async () => {
    const mockData = {
      id: "abc",
      name: "Test Artist",
      country: "US",
      "life-span": { begin: "2000" },
    };

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => mockData,
    });

    const req = new NextRequest(
      "http://localhost:3000/api/musicbrainz/artist?id=abc",
    );
    const res = await GET(req);
    const json = await res.json();

    expect(json.artist.name).toBe("Test Artist");
    expect(json.artist.country).toBe("US");
    expect(json.artist.id).toBe("abc");
  });

  it("should search artists by query", async () => {
    const mockData = {
      artists: [
        { id: "1", name: "Artist 1" },
        { id: "2", name: "Artist 2" },
      ],
    };

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => mockData,
    });

    const req = new NextRequest(
      "http://localhost:3000/api/musicbrainz/artist?query=test",
    );
    const res = await GET(req);
    const json = await res.json();

    expect(json.artists).toHaveLength(2);
    expect(json.artists[0].name).toBe("Artist 1");
  });
});
