import { groupGenrePills, genreGroupIdForLabel } from "@/lib/genreGroups";
import type { BrowsePill } from "@/lib/appleMusic/types";

describe("genreGroups", () => {
  it("puts core styles, regions, and occasions in separate buckets", () => {
    const pills = [
      { key: "14", label: "Pop", query: "Pop", playlists: [] },
      { key: "21", label: "Rock", query: "Rock", playlists: [] },
      { key: "1203", label: "African", query: "African", playlists: [] },
      { key: "12", label: "Latin", query: "Latin", playlists: [] },
      { key: "50", label: "Fitness & Workout", query: "Fitness & Workout", playlists: [] },
      { key: "16", label: "Soundtrack", query: "Soundtrack", playlists: [] },
    ] as BrowsePill[];

    const sections = groupGenrePills(pills);

    expect(sections.map((section) => section.id)).toEqual([
      "sound",
      "place",
      "occasion",
    ]);
    expect(sections[0]?.pills.map((pill) => pill.label)).toEqual(["Pop", "Rock"]);
    expect(sections[1]?.pills.map((pill) => pill.label)).toEqual([
      "African",
      "Latin",
    ]);
    expect(sections[2]?.pills.map((pill) => pill.label)).toEqual([
      "Fitness & Workout",
      "Soundtrack",
    ]);
  });

  it("defaults unknown labels to sound", () => {
    expect(genreGroupIdForLabel("Shoegaze")).toBe("sound");
  });
});
