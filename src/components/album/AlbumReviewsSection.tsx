"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LuMessageSquare } from "react-icons/lu";
import { toast } from "sonner";

import { RATING_COLORS } from "@/components/rating/constants";
import Button from "@/components/ui/Button";
import {
  enlargeAvatarUrl,
  formatReviewDate,
  reviewAuthorLabel,
  type AlbumReview,
} from "@/lib/albumReviews";

import { ALBUM_REVIEWS_SECTION_ID } from "./AlbumReviewsButton";

function ratingColor(score: number) {
  const index = Math.min(Math.max(Math.round(score), 1), 10) - 1;
  return RATING_COLORS[index];
}

function ReviewAvatar({
  name,
  url,
}: {
  name: string;
  url: string | null;
}) {
  const src = enlargeAvatarUrl(url);

  return (
    <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full bg-neutral-100">
      {src ? (
        <img
          src={src}
          alt=""
          className="h-full w-full object-cover"
          referrerPolicy="no-referrer"
        />
      ) : (
        <span
          aria-hidden
          className="flex h-full w-full items-center justify-center text-sm font-medium text-neutral-500"
        >
          {name.slice(0, 1).toUpperCase()}
        </span>
      )}
    </div>
  );
}

function ReviewCard({
  review,
  isOwn,
  avatarUrl,
  onEdit,
  onDelete,
}: {
  review: AlbumReview;
  isOwn: boolean;
  avatarUrl: string | null;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const name = reviewAuthorLabel(review.author);
  const profileHref = review.author.username
    ? `/user/${review.author.username}`
    : null;

  return (
    <article className="rounded-xl border border-neutral-100 bg-white px-5 py-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
      <div className="flex items-start gap-4">
        <ReviewAvatar name={name} url={avatarUrl} />

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2.5">
            {profileHref ? (
              <Link
                href={profileHref}
                className="truncate text-sm font-medium text-neutral-900 hover:underline"
              >
                {name}
              </Link>
            ) : (
              <span className="truncate text-sm font-medium text-neutral-900">
                {name}
              </span>
            )}
            <span
              className="flex h-7 min-w-7 shrink-0 items-center justify-center rounded-md px-1.5 text-xs font-semibold text-white"
              style={{ backgroundColor: ratingColor(review.score) }}
            >
              {review.score.toFixed(1)}
            </span>
          </div>
          <p className="mt-1 text-xs text-neutral-500">
            {formatReviewDate(review.createdAt)}
          </p>

          <p className="mt-3 text-[15px] leading-7 text-neutral-800 whitespace-pre-wrap">
            {review.body}
          </p>

          {isOwn ? (
            <div className="mt-4 flex gap-4">
              <button
                type="button"
                onClick={onEdit}
                className="text-sm text-neutral-500 transition-colors hover:text-neutral-900"
              >
                Edit
              </button>
              <button
                type="button"
                onClick={onDelete}
                className="text-sm text-neutral-500 transition-colors hover:text-red-600"
              >
                Delete
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </article>
  );
}

export interface AlbumReviewsSectionProps {
  reviews: AlbumReview[];
  loading: boolean;
  currentUserId?: string | null;
  currentUserAvatarUrl?: string | null;
  canWrite: boolean;
  isSignedIn: boolean;
  isFullyRated: boolean;
  ratedTracksCount: number;
  totalTracks: number;
  albumType: string;
  showWriteHints: boolean;
  onWrite: () => void;
  onEdit: () => void;
  onDeleteOwn: () => Promise<void>;
}

export default function AlbumReviewsSection({
  reviews,
  loading,
  currentUserId,
  currentUserAvatarUrl,
  canWrite,
  isSignedIn,
  isFullyRated,
  ratedTracksCount,
  totalTracks,
  albumType,
  showWriteHints,
  onWrite,
  onEdit,
  onDeleteOwn,
}: AlbumReviewsSectionProps) {
  const pathname = usePathname();
  const loginHref = `/login?view=login&next=${encodeURIComponent(pathname || "/")}`;
  const ownReview = currentUserId
    ? reviews.find((review) => review.userId === currentUserId)
    : undefined;
  const releaseLabel = albumType === "EP" ? "EP" : "album";
  const showHints = showWriteHints && reviews.length === 0 && !loading;

  const handleDelete = async () => {
    if (!ownReview) return;
    if (!window.confirm("Delete your review? This cannot be undone.")) return;
    try {
      await onDeleteOwn();
      toast.success("Review deleted");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not delete review");
    }
  };

  return (
    <section
      id={ALBUM_REVIEWS_SECTION_ID}
      className="mt-12 scroll-mt-24 w-full"
    >
      <div className="mb-5 flex items-end justify-between gap-3">
        <div className="flex items-center gap-2">
          <LuMessageSquare size={18} />
          <h3 className="text-xs uppercase">Reviews</h3>
        </div>

        {ownReview ? (
          <Button type="button" variant="secondary" size="xs" onClick={onEdit}>
            EDIT REVIEW
          </Button>
        ) : canWrite ? (
          <Button type="button" variant="secondary" size="xs" onClick={onWrite}>
            WRITE REVIEW
          </Button>
        ) : null}
      </div>

      {showHints && !isSignedIn ? (
        <p className="mb-5 text-sm text-neutral-600">
          <Link href={loginHref} className="underline hover:text-neutral-900">
            Sign in
          </Link>{" "}
          and rate every track to review this {releaseLabel}.
        </p>
      ) : showHints && !isFullyRated ? (
        <p className="mb-5 text-sm text-neutral-600">
          Rate all {totalTracks} tracks to write a review
          {totalTracks > 0 ? ` (${ratedTracksCount}/${totalTracks})` : ""}.
        </p>
      ) : null}

      {loading && reviews.length === 0 ? (
        <div className="flex flex-col gap-4">
          {[0, 1].map((key) => (
            <div
              key={key}
              className="flex gap-4 rounded-xl border border-neutral-100 bg-white px-5 py-5"
            >
              <div className="h-12 w-12 animate-pulse rounded-full bg-neutral-100" />
              <div className="flex-1 space-y-3">
                <div className="h-4 w-28 animate-pulse rounded bg-neutral-100" />
                <div className="h-12 w-full animate-pulse rounded bg-neutral-50" />
              </div>
            </div>
          ))}
        </div>
      ) : reviews.length === 0 ? (
        <div className="rounded-xl border border-neutral-100 bg-white px-5 py-8 text-sm leading-6 text-neutral-600">
          No reviews yet.
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {reviews.map((review) => (
            <ReviewCard
              key={review.id}
              review={review}
              isOwn={review.userId === currentUserId}
              avatarUrl={
                review.userId === currentUserId
                  ? review.author.avatarUrl || currentUserAvatarUrl || null
                  : review.author.avatarUrl
              }
              onEdit={onEdit}
              onDelete={() => void handleDelete()}
            />
          ))}
        </div>
      )}
    </section>
  );
}
