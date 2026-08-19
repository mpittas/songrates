import {
  ALBUMS_FOR_LEVEL,
  EMPTY_PROGRESSION,
  PERKS,
  REVIEWS_FOR_LEVEL,
  XP_BY_ALBUM_TYPE,
  albumsFromPreviousLevel,
  albumsToLevel,
  completingAlbumWouldReachLevel,
  formatGoalShort,
  formatRemainingToGoal,
  getProgressionView,
  getRankLadder,
  incompleteAlbumsForProgress,
  levelFromProgress,
  nextPerk,
  progressionFromRow,
  rankForLevel,
  remainingToLevel,
  reviewsFromPreviousLevel,
  unlockedPerkIds,
  unlockedPerks,
  xpForAlbumType,
  xpFromRatedAlbums,
} from "@/lib/profileProgression";

describe("xpForAlbumType", () => {
  it("weights release types to match the SQL catalog", () => {
    expect(xpForAlbumType("Album")).toBe(100);
    expect(xpForAlbumType("EP")).toBe(60);
    expect(xpForAlbumType("Compilation")).toBe(40);
    expect(xpForAlbumType("Single")).toBe(15);
  });

  it("falls back to Album weighting when type is missing or unknown", () => {
    expect(xpForAlbumType(undefined)).toBe(XP_BY_ALBUM_TYPE.Album);
    expect(xpForAlbumType(null)).toBe(XP_BY_ALBUM_TYPE.Album);
    expect(xpForAlbumType("")).toBe(XP_BY_ALBUM_TYPE.Album);
    expect(xpForAlbumType("lp")).toBe(XP_BY_ALBUM_TYPE.Album);
  });

  it("ignores case and surrounding space", () => {
    expect(xpForAlbumType(" ep ")).toBe(60);
    expect(xpForAlbumType("SINGLE")).toBe(15);
  });
});

describe("levelFromProgress", () => {
  it("matches the published album and review table", () => {
    expect(levelFromProgress(0, 0)).toBe(0);
    expect(levelFromProgress(4, 0)).toBe(0);
    expect(levelFromProgress(5, 0)).toBe(1);
    expect(levelFromProgress(9, 0)).toBe(1);
    expect(levelFromProgress(10, 0)).toBe(2);
    expect(levelFromProgress(15, 0)).toBe(3);
    expect(levelFromProgress(20, 0)).toBe(3);
    expect(levelFromProgress(20, 1)).toBe(4);
    expect(levelFromProgress(24, 2)).toBe(4);
    expect(levelFromProgress(25, 1)).toBe(4);
    expect(levelFromProgress(25, 2)).toBe(5);
    expect(levelFromProgress(40, 8)).toBe(5);
  });

  it("does not grant Selector or Legend on albums alone", () => {
    expect(levelFromProgress(25, 0)).toBe(3);
  });

  it("does not go below unranked", () => {
    expect(levelFromProgress(-3, -1)).toBe(0);
  });
});

describe("ranks and perks", () => {
  it("names ranks from the catalog", () => {
    expect(rankForLevel(0)).toBe("Unranked");
    expect(rankForLevel(1)).toBe("Listener");
    expect(rankForLevel(2)).toBe("First Spin");
    expect(rankForLevel(4)).toBe("Selector");
    expect(rankForLevel(5)).toBe("Legend");
    expect(rankForLevel(12)).toBe("Legend");
  });

  it("gates perks on level number", () => {
    expect(unlockedPerkIds(0)).toEqual([]);
    expect(unlockedPerkIds(1)).toEqual(["profile_cover"]);
    expect(unlockedPerkIds(2)).toEqual(["profile_cover", "profile_badge"]);
    expect(unlockedPerkIds(3)).toEqual([
      "profile_cover",
      "profile_badge",
      "avatar_border",
    ]);
    expect(unlockedPerkIds(4)).toEqual([
      "profile_cover",
      "profile_badge",
      "avatar_border",
      "vinyl_player",
    ]);
    expect(unlockedPerkIds(5)).toEqual([
      "profile_cover",
      "profile_badge",
      "avatar_border",
      "vinyl_player",
      "beat_game",
    ]);
    expect(nextPerk(0)?.id).toBe("profile_cover");
    expect(nextPerk(3)?.id).toBe("vinyl_player");
    expect(nextPerk(4)?.id).toBe("beat_game");
    expect(nextPerk(5)).toBeNull();
    expect(PERKS.find((perk) => perk.id === "vinyl_player")?.minLevel).toBe(4);
    expect(PERKS.find((perk) => perk.id === "avatar_border")?.summary).toMatch(
      /discord/i,
    );
    expect(unlockedPerks(0)).toEqual([]);
  });
});

describe("album and review goals", () => {
  it("counts albums and reviews between consecutive ranks", () => {
    expect(albumsFromPreviousLevel(1)).toBe(5);
    expect(albumsFromPreviousLevel(2)).toBe(5);
    expect(albumsFromPreviousLevel(5)).toBe(5);
    expect(reviewsFromPreviousLevel(3)).toBe(0);
    expect(reviewsFromPreviousLevel(4)).toBe(1);
    expect(reviewsFromPreviousLevel(5)).toBe(1);
    expect(ALBUMS_FOR_LEVEL[4]).toBe(20);
    expect(REVIEWS_FOR_LEVEL[5]).toBe(2);
  });

  it("counts remaining albums from current progress to a rank", () => {
    expect(albumsToLevel(0, 1)).toBe(5);
    expect(albumsToLevel(3, 1)).toBe(2);
    expect(albumsToLevel(0, 4)).toBe(20);
    expect(albumsToLevel(20, 4)).toBe(0);
    expect(remainingToLevel(18, 0, 4)).toEqual({ albums: 2, reviews: 1 });
    expect(remainingToLevel(25, 1, 5)).toEqual({ albums: 0, reviews: 1 });
  });

  it("only marks an album as getting you there when it finishes the next rank", () => {
    expect(completingAlbumWouldReachLevel(4, 0, 1)).toBe(true);
    expect(completingAlbumWouldReachLevel(3, 0, 1)).toBe(false);
    expect(completingAlbumWouldReachLevel(19, 0, 4)).toBe(false);
    expect(completingAlbumWouldReachLevel(19, 1, 4)).toBe(true);
  });
});

describe("goal copy", () => {
  it("names albums, reviews, or both", () => {
    expect(formatRemainingToGoal({ albums: 5, reviews: 0 }, "reach Listener")).toBe(
      "Rate 5 more albums to reach Listener",
    );
    expect(formatRemainingToGoal({ albums: 0, reviews: 1 }, "reach Selector")).toBe(
      "Write 1 review to reach Selector",
    );
    expect(
      formatRemainingToGoal({ albums: 2, reviews: 1 }, "reach Selector"),
    ).toBe("Rate 2 more albums and write 1 review to reach Selector");
    expect(formatGoalShort({ albums: 5, reviews: 0 }, "Listener")).toBe(
      "5 albums to Listener",
    );
    expect(formatGoalShort({ albums: 0, reviews: 2 }, "Legend")).toBe(
      "2 reviews to Legend",
    );
  });
});

describe("getRankLadder", () => {
  it("lists five ranks with perks attached to their unlock level", () => {
    const ladder = getRankLadder();
    expect(ladder).toHaveLength(5);
    expect(ladder[0]).toMatchObject({
      level: 1,
      rank: "Listener",
      albumsFromPrevious: 5,
      albumsFromStart: 5,
      reviewsFromStart: 0,
    });
    expect(ladder[0].perks.map((perk) => perk.id)).toEqual(["profile_cover"]);
    expect(ladder[1].perks.map((perk) => perk.id)).toEqual(["profile_badge"]);
    expect(ladder[2].perks.map((perk) => perk.id)).toEqual(["avatar_border"]);
    expect(ladder[3].albumsFromStart).toBe(20);
    expect(ladder[3].reviewsFromStart).toBe(1);
    expect(ladder[3].perks.map((perk) => perk.id)).toEqual(["vinyl_player"]);
    expect(ladder[4].rank).toBe("Legend");
    expect(ladder[4].albumsFromStart).toBe(25);
    expect(ladder[4].reviewsFromStart).toBe(2);
    expect(ladder[4].perks.map((perk) => perk.id)).toEqual(["beat_game"]);
  });
});

describe("incompleteAlbumsForProgress", () => {
  it("sorts closest-to-done first and skips complete or unknown totals", () => {
    const rows = incompleteAlbumsForProgress([
      {
        id: "done",
        title: "Done",
        artistName: "A",
        totalTracks: 10,
        ratedTrackIds: Array(10).fill("t"),
        albumType: "Album",
      },
      {
        id: "almost",
        title: "Almost",
        artistName: "B",
        totalTracks: 12,
        ratedTrackIds: Array(11).fill("t"),
        albumType: "Album",
      },
      {
        id: "ep",
        title: "Halfway EP",
        artistName: "C",
        totalTracks: 6,
        ratedTrackIds: Array(3).fill("t"),
        albumType: "EP",
      },
      {
        id: "unknown",
        title: "Unknown",
        artistName: "D",
        totalTracks: 0,
        ratedTrackIds: ["t"],
      },
    ]);

    expect(rows.map((row) => row.id)).toEqual(["almost", "ep"]);
    expect(rows[0]).toMatchObject({
      remainingTracks: 1,
      xpOnComplete: 100,
    });
    expect(rows[1].xpOnComplete).toBe(60);
  });
});

describe("xpFromRatedAlbums", () => {
  it("only counts fully rated releases and revokes incomplete ones", () => {
    const albums = [
      { totalTracks: 12, ratedTrackIds: Array(12).fill("a"), albumType: "Album" },
      { totalTracks: 6, ratedTrackIds: Array(6).fill("e"), albumType: "EP" },
      { totalTracks: 1, ratedTrackIds: ["s"], albumType: "Single" },
      { totalTracks: 12, ratedTrackIds: ["partial"], albumType: "Album" },
    ];

    expect(xpFromRatedAlbums(albums)).toEqual({
      xp: 175,
      fullyRatedCount: 3,
    });

    const afterUnrate = [
      albums[0],
      albums[1],
      { ...albums[2], ratedTrackIds: [] },
      albums[3],
    ];
    expect(xpFromRatedAlbums(afterUnrate)).toEqual({
      xp: 160,
      fullyRatedCount: 2,
    });
  });
});

describe("progressionFromRow", () => {
  it("treats level 0 as unranked instead of coalescing to 1", () => {
    expect(
      progressionFromRow({
        xp: 0,
        level: 0,
        fully_rated_count: 0,
        review_count: 0,
      }).level,
    ).toBe(0);
  });

  it("recomputes level from counts so a stale row cannot inflate rank", () => {
    expect(
      progressionFromRow({
        xp: 9000,
        level: 5,
        fully_rated_count: 6,
        review_count: 0,
      }).level,
    ).toBe(1);
  });
});

describe("getProgressionView", () => {
  it("points new listeners at Listener, not a distant perk", () => {
    const view = getProgressionView(0, 0);
    expect(view.rank).toBe("Unranked");
    expect(view.level).toBe(0);
    expect(view.isUnranked).toBe(true);
    expect(view.nextLevel).toBe(1);
    expect(view.hint).toBe("Rate 5 more albums to reach Listener");
    expect(view.goalShort).toBe("5 albums to Listener");
    expect(view.nextPerkHint).toBe(
      "Rate 5 more albums to unlock Custom profile cover",
    );
    expect(view.progressPercent).toBe(0);
    expect(view.stepAlbums).toBe(5);
    expect(view.stepAlbumsDone).toBe(0);
  });

  it("uses remaining albums for the next rank", () => {
    expect(getProgressionView(5, 0).hint).toBe(
      "Rate 5 more albums to reach First Spin",
    );
    expect(getProgressionView(8, 0).goalShort).toBe("2 albums to First Spin");
    expect(getProgressionView(15, 0).hint).toBe(
      "Rate 5 more albums and write 1 review to reach Selector",
    );
    expect(getProgressionView(20, 0).hint).toBe(
      "Write 1 review to reach Selector",
    );
    expect(getProgressionView(20, 1).hint).toBe(
      "Rate 5 more albums and write 1 review to reach Legend",
    );
  });

  it("keeps the distant perk as a separate hint", () => {
    expect(getProgressionView(15, 0).nextPerkHint).toBe(
      "Rate 5 more albums and write 1 review to unlock 3D vinyl player",
    );
    expect(getProgressionView(20, 1).nextPerkHint).toBe(
      "Rate 5 more albums and write 1 review to unlock Beat game",
    );
  });

  it("fills the in-level bar between album thresholds", () => {
    const view = getProgressionView(7, 0);
    expect(view.level).toBe(1);
    expect(view.albumsIntoLevel).toBe(2);
    expect(view.albumsForNextLevel).toBe(5);
    expect(view.progressPercent).toBe(40);
    expect(view.stepAlbums).toBe(5);
    expect(view.stepAlbumsDone).toBe(2);
    expect(view.goalShort).toBe("3 albums to First Spin");
  });

  it("hides the next-unlock line at Legend", () => {
    expect(getProgressionView(25, 2).hint).toBeNull();
    expect(getProgressionView(25, 2).goalShort).toBeNull();
    expect(getProgressionView(40, 9).hint).toBeNull();
    expect(getProgressionView(EMPTY_PROGRESSION.fullyRatedCount).level).toBe(0);
  });
});
