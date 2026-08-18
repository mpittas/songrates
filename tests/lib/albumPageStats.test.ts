import {
  isFullyRatedAlbum,
  isPartiallyRatedAlbum,
  isReviewableAlbumType,
} from "@/lib/albumPageStats";

describe("isFullyRatedAlbum", () => {
  it("requires a known track count greater than zero", () => {
    expect(isFullyRatedAlbum(1, 0)).toBe(false);
    expect(isFullyRatedAlbum(1, undefined)).toBe(false);
    expect(isFullyRatedAlbum(12, 12)).toBe(true);
    expect(isFullyRatedAlbum(1, 1)).toBe(true);
  });

  it("does not treat a single rating as complete when the album has more tracks", () => {
    expect(isFullyRatedAlbum(1, 12)).toBe(false);
    expect(isPartiallyRatedAlbum(1, 12)).toBe(true);
  });

  it("treats unknown totals with any ratings as partial", () => {
    expect(isPartiallyRatedAlbum(1, 0)).toBe(true);
    expect(isPartiallyRatedAlbum(1, undefined)).toBe(true);
    expect(isPartiallyRatedAlbum(0, 12)).toBe(false);
  });
});

describe("isReviewableAlbumType", () => {
  it("allows albums and EPs", () => {
    expect(isReviewableAlbumType("Album")).toBe(true);
    expect(isReviewableAlbumType("EP")).toBe(true);
  });

  it("rejects singles, compilations, and unknown types", () => {
    expect(isReviewableAlbumType("Single")).toBe(false);
    expect(isReviewableAlbumType("Compilation")).toBe(false);
    expect(isReviewableAlbumType(undefined)).toBe(false);
  });
});
