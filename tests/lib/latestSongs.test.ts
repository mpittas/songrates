import {
  artistNameMentions,
  collectLatestSongsFromAlbums,
  isAlternateLatestSongName,
  latestSongCreditsArtist,
  songTitleKey,
} from "@/lib/appleMusic/latestSongs";

const testArtist = { id: "artist-1", name: "Test Artist" };

function album(id: string, name: string, tracks: object[], extra: object = {}) {
  return {
    id,
    attributes: { name, artistName: "Test Artist", releaseDate: "2026-01-01", ...extra },
    relationships: { tracks: { data: tracks } },
  };
}

function song(
  id: string,
  name: string,
  attrs: Record<string, unknown> = {},
) {
  return {
    id,
    type: "songs",
    attributes: {
      name,
      artistName: "Test Artist",
      albumName: "Single",
      releaseDate: "2026-01-01",
      durationInMillis: 180000,
      ...attrs,
    },
  };
}

describe("latestSongs", () => {
  it("flags remix, acoustic, and mixed variants", () => {
    expect(isAlternateLatestSongName("Opalite (Chris Lake Remix)")).toBe(true);
    expect(isAlternateLatestSongName("Song (Acoustic Version)")).toBe(true);
    expect(isAlternateLatestSongName("Song [Mixed]")).toBe(true);
    expect(isAlternateLatestSongName("I Knew It, I Knew You")).toBe(false);
  });

  it("strips parentheticals for title keys", () => {
    expect(songTitleKey('I Knew It (From "Toy Story 5")')).toBe("i knew it");
  });

  it("matches featured credit lines without partial-word false positives", () => {
    expect(artistNameMentions("Jack White ft. Eminem", "Eminem")).toBe(true);
    expect(artistNameMentions("Jack White", "Eminem")).toBe(false);
    expect(artistNameMentions("Nasty", "Nas")).toBe(false);
  });

  it("keeps lead tracks, skips videos and alternate versions, and sorts by date", () => {
    const songs = collectLatestSongsFromAlbums(
      [
        album("a1", "New Song - Single", [
          song("s1", "New Song", { releaseDate: "2026-06-01" }),
          song("s1b", "New Song (Acoustic Version)", { releaseDate: "2026-06-01" }),
          {
            id: "mv1",
            type: "music-videos",
            attributes: { name: "New Song", releaseDate: "2026-06-01" },
          },
        ]),
        album("a2", "Older Song - Single", [
          song("s2", "Older Song", { releaseDate: "2025-01-01" }),
        ]),
      ],
      testArtist,
      20,
    );

    expect(songs.map((s) => s.name)).toEqual(["New Song", "Older Song"]);
    expect(songs[0]?.albumId).toBe("a1");
    expect(songs[0]?.artistId).toBe("artist-1");
  });

  it("drops sibling tracks on a featured single that do not credit this artist", () => {
    const eminem = { id: "eminem", name: "Eminem" };
    const songs = collectLatestSongsFromAlbums(
      [
        album("live", "Live at Ford Field - Single", [
          song("1", "That's How I'm Feeling (Live)", {
            artistName: "Jack White",
            releaseDate: "2025-11-27",
          }),
          song("2", "Hello Operator / 'Till I Collapse (Live)", {
            artistName: "Jack White ft. Eminem",
            releaseDate: "2025-11-27",
          }),
          song("3", "Seven Nation Army (Live)", {
            artistName: "Jack White",
            releaseDate: "2025-11-27",
          }),
        ], { artistName: "Jack White" }),
      ],
      eminem,
    );

    expect(songs.map((s) => s.name)).toEqual([
      "Hello Operator / 'Till I Collapse (Live)",
    ]);
  });

  it("keeps a featured track when Apple only lists this artist as featured", () => {
    const eminem = { id: "eminem", name: "Eminem" };
    const songs = collectLatestSongsFromAlbums(
      [
        album("live", "Live at Ford Field - Single", [
          {
            ...song("2", "Hello Operator / 'Till I Collapse (Live)", {
              artistName: "Jack White",
            }),
            relationships: {
              artists: { data: [{ id: "jack-white" }] },
              "featured-artists": { data: [{ id: "eminem" }] },
            },
          },
          {
            ...song("3", "Seven Nation Army (Live)", {
              artistName: "Jack White",
            }),
            relationships: {
              artists: { data: [{ id: "jack-white" }] },
            },
          },
        ]),
      ],
      eminem,
    );

    expect(songs.map((s) => s.name)).toEqual([
      "Hello Operator / 'Till I Collapse (Live)",
    ]);
  });

  it("dedupes the same A-side when it appears on later singles", () => {
    const songs = collectLatestSongsFromAlbums(
      [
        album("remix", "Hit (Remix) - Single", [
          song("r1", "Hit (Someone Remix)", { releaseDate: "2026-03-01" }),
          song("orig", "Hit", { releaseDate: "2025-10-01" }),
        ]),
        album("orig-single", "Hit - Single", [
          song("orig", "Hit", { releaseDate: "2025-10-01" }),
        ]),
      ],
      testArtist,
    );

    expect(songs.map((s) => s.name)).toEqual(["Hit"]);
  });

  it("respects the limit after sorting", () => {
    const songs = collectLatestSongsFromAlbums(
      [
        album("a", "Bundle", [
          song("1", "C", { releaseDate: "2024-01-01" }),
          song("2", "A", { releaseDate: "2026-01-01" }),
          song("3", "B", { releaseDate: "2025-01-01" }),
        ]),
      ],
      testArtist,
      2,
    );

    expect(songs.map((s) => s.name)).toEqual(["A", "B"]);
  });

  it("drops enriched songs whose credits do not include this artist", () => {
    expect(
      latestSongCreditsArtist(
        {
          artistName: "Jack White",
          artists: [{ id: "jack-white", name: "Jack White" }],
        },
        { id: "eminem", name: "Eminem" },
      ),
    ).toBe(false);
    expect(
      latestSongCreditsArtist(
        {
          artistName: "Jack White ft. Eminem",
          artists: [{ id: "jack-white", name: "Jack White" }],
        },
        { id: "eminem", name: "Eminem" },
      ),
    ).toBe(true);
    expect(
      latestSongCreditsArtist(
        {
          artistName: "Jack White ft. Eminem",
          artists: [
            { id: "jack-white", name: "Jack White" },
            { id: "eminem", name: "Eminem" },
          ],
        },
        { id: "eminem", name: "Eminem" },
      ),
    ).toBe(true);
  });
});
