/**
 * @jest-environment node
 */
import { GET } from "./route";
import { NextRequest } from "next/server";

// Mock fetch globally
global.fetch = jest.fn();

describe("GET /api/artist-info", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return 400 if artist ID is missing", async () => {
    const req = new NextRequest("http://localhost:3000/api/artist-info");
    const res = await GET(req);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBe("Missing artist ID");
  });

  it("should fetch data from MusicBrainz and Wikidata and return combined result", async () => {
    const mockMbData = {
      relations: [
        { type: "official homepage", url: { resource: "https://example.com" } },
      ],
      name: "Test Artist",
      country: "US",
      "life-span": { begin: "2000" },
    };

    const mockWikidataData = {
      results: {
        bindings: [
          {
            image: { value: "http://image.url" },
            artistDescription: { value: "A great artist" },
            wikipediaLink: { value: "http://wiki.url" },
          },
        ],
      },
    };

    (global.fetch as jest.Mock).mockImplementation((url: string) => {
      if (url.includes("musicbrainz.org")) {
        return Promise.resolve({
          ok: true,
          json: async () => mockMbData,
        });
      }
      if (url.includes("wikidata.org")) {
        return Promise.resolve({
          ok: true,
          json: async () => mockWikidataData,
        });
      }
      return Promise.reject(new Error(`Unknown URL: ${url}`));
    });

    const req = new NextRequest("http://localhost:3000/api/artist-info?id=123");
    const res = await GET(req);

    expect(res.status).toBe(200);
    const json = await res.json();

    expect(json.artistInfo.officialSite).toBe("https://example.com");
    expect(json.artistInfo.image).toBe("http://image.url");
    expect(json.artist.name).toBe("Test Artist");
    expect(json.artist.country).toBe("US");

    // Verify fetch was called twice
    expect(global.fetch).toHaveBeenCalledTimes(2);
  });

  it("should handle API errors gracefully (HTTP error)", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      json: async () => ({}),
    });

    const req = new NextRequest("http://localhost:3000/api/artist-info?id=123");
    const res = await GET(req);

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.artistInfo.officialSite).toBeNull();
    expect(json.artist.name).toBeNull();
  });

  it("should handle network errors gracefully (fetch throws)", async () => {
    (global.fetch as jest.Mock).mockRejectedValue(new Error("Network Error"));

    const req = new NextRequest("http://localhost:3000/api/artist-info?id=123");
    const res = await GET(req);

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.artistInfo.officialSite).toBeNull();
    expect(json.artist.name).toBeNull();
  });
});
