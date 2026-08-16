import { isReviewableAlbumType } from "@/lib/albumPageStats";

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
