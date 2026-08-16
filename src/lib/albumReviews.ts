export const ALBUM_REVIEW_MIN_LENGTH = 10;
export const ALBUM_REVIEW_MAX_LENGTH = 2000;

export interface AlbumReviewAuthor {
  username: string | null;
  displayName: string | null;
  avatarUrl: string | null;
}

export interface AlbumReview {
  id: string;
  userId: string;
  albumId: string;
  body: string;
  score: number;
  createdAt: string;
  updatedAt: string;
  author: AlbumReviewAuthor;
}

export interface AlbumReviewsResponse {
  reviews: AlbumReview[];
  count: number;
}

export function reviewAuthorLabel(author: AlbumReviewAuthor) {
  return author.username || author.displayName || "Listener";
}

export function enlargeAvatarUrl(url: string | null) {
  if (!url) return null;
  return url.replace(/=s\d+-c\b/, "=s192-c");
}

export function formatReviewDate(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
