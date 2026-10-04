/**
 * The one 1–10 rating scale used for track circles, album scores and review
 * badges. Every step keeps white text above 4.5:1 contrast.
 */
export const RATING_COLORS = [
  "#b42318", // 1
  "#c2410c", // 2
  "#b45309", // 3
  "#a16207", // 4
  "#8a6c04", // 5
  "#677a0c", // 6
  "#4d7c0f", // 7
  "#15803d", // 8
  "#047857", // 9
  "#0f766e", // 10
];

/** Colour for a (possibly fractional) score; rounds and clamps to 1–10. */
export function ratingColor(score: number) {
  const index = Math.min(Math.max(Math.round(score), 1), 10) - 1;
  return RATING_COLORS[index];
}
