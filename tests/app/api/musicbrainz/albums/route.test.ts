/**
 * @jest-environment node
 */
import { GET } from "@/app/api/musicbrainz/albums/route";
import { NextRequest } from "next/server";
import { albumCache } from "@/lib/cache";

global.fetch = jest.fn();

describe("GET /api/musicbrainz/albums", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    albumCache.clear();
  });

  it("should return empty list if artistId is missing", async () => {
    const req = new NextRequest("http://localhost:3000/api/musicbrainz/albums");
    const res = await GET(req);
    const json = await res.json();
    expect(json.albums).toEqual([]);
  });

  it("should return albums filtering out non-studio types", async () => {
    const mockMbData = {
      "release-groups": [
        {
          id: "1",
          title: "Album 1",
          "primary-type": "Album",
          "secondary-types": [],
          "first-release-date": "2020-01-01",
        }, // Keep
        {
          id: "2",
          title: "Live Album",
          "primary-type": "Album",
          "secondary-types": ["Live"],
        }, // Discard
        {
          id: "3",
          title: "Compilation",
          "primary-type": "Album",
          "secondary-types": ["Compilation"],
        }, // Discard
        {
          id: "4",
          title: "Single",
          "primary-type": "Single",
          "secondary-types": [],
        }, // Discard - even if primary type check was only check, this should be filtered by query usually, but safe to test
      ],
    };

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => mockMbData,
    });

    const req = new NextRequest(
      "http://localhost:3000/api/musicbrainz/albums?artistId=123",
    );
    const res = await GET(req);
    const json = await res.json();

    expect(json.albums).toHaveLength(1);
    expect(json.albums[0].title).toBe("Album 1");
  });

  it("should fetch Wikipedia links for albums with Wikidata relations", async () => {
    const mockMbData = {
      "release-groups": [
        {
          id: "1",
          title: "Album 1",
          "primary-type": "Album",
          "secondary-types": [],
          relations: [
            {
              type: "wikidata",
              url: { resource: "https://www.wikidata.org/wiki/Q1" },
            },
          ],
        },
        {
          id: "2",
          title: "Album 2",
          "primary-type": "Album",
          "secondary-types": [],
          relations: [],
        },
      ],
    };

    const mockWdData = {
      entities: {
        Q1: {
          sitelinks: {
            enwiki: {
              url: "https://en.wikipedia.org/wiki/Album_1",
            },
          },
        },
      },
    };

    (global.fetch as jest.Mock).mockImplementation((url: string) => {
      if (url.includes("musicbrainz.org")) {
        return Promise.resolve({
          ok: true,
          json: async () => mockMbData,
        });
      }
      if (url.includes("wikidata.org") && url.includes("ids=Q1")) {
        return Promise.resolve({
          ok: true,
          json: async () => mockWdData,
        });
      }
      return Promise.reject(new Error(`Unknown URL: ${url}`));
    });

    const req = new NextRequest(
      "http://localhost:3000/api/musicbrainz/albums?artistId=123",
    );
    const res = await GET(req);
    const json = await res.json();

    expect(json.albums).toHaveLength(2);
    const album1 = json.albums.find((a: any) => a.id === "1");
    const album2 = json.albums.find((a: any) => a.id === "2");

    expect(album1.wikipediaUrl).toBe("https://en.wikipedia.org/wiki/Album_1");
    expect(album2.wikipediaUrl).toBeUndefined();
  });
});
