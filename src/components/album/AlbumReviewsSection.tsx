"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LuLock, LuMessageSquare, LuPencil } from "react-icons/lu";
import { toast } from "sonner";

import { ratingColor } from "@/components/rating/constants";
import Button from "@/components/ui/Button";
import EmptyState from "@/components/ui/EmptyState";
import SectionHeader from "@/components/ui/SectionHeader";
import { Skeleton } from "@/components/ui/Skeleton";
import {
  enlargeAvatarUrl,
  formatReviewDate,
  reviewAuthorLabel,
  type AlbumReview,
} from "@/lib/albumReviews";

import { ALBUM_REVIEWS_SECTION_ID } from "./AlbumReviewsButton";

function ReviewAvatar({
  name,
  url,
}: {
  name: string;
  url: string | null;
}) {
  const src = enlargeAvatarUrl(url);

  return (
    <div className="relative size-10 shrink-0 overflow-hidden rounded-full bg-subtle">
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
          className="flex h-full w-full items-center justify-center bg-ink text-sm font-semibold text-white"
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
    <article className="rounded-2xl bg-surface p-5 shadow-card sm:p-6">
      <header className="flex items-center gap-3">
        <ReviewAvatar name={name} url={avatarUrl} />
        <div className="min-w-0 flex-1">
          {profileHref ? (
            <Link
              href={profileHref}
              className="block truncate text-sm font-semibold text-ink hover:underline"
            >
              {name}
            </Link>
          ) : (
            <span className="block truncate text-sm font-semibold text-ink">
              {name}
            </span>
          )}
          <p className="text-xs text-ink-3">
            {formatReviewDate(review.createdAt)}
            {isOwn ? " · Your review" : ""}
          </p>
        </div>
        <span
          className="flex h-8 min-w-11 shrink-0 items-center justify-center rounded-lg px-2 text-sm font-semibold text-white tabular-nums"
          style={{ backgroundColor: ratingColor(review.score) }}
          aria-label={`Scored ${review.score.toFixed(1)} out of 10`}
        >
          {review.score.toFixed(1)}
        </span>
      </header>

      <p className="mt-4 text-[15px] leading-7 whitespace-pre-wrap text-ink">
        {review.body}
      </p>

      {isOwn ? (
        <div className="mt-4 flex gap-1 border-t border-line pt-3">
          <Button variant="ghost" size="sm" onClick={onEdit}>
            Edit
          </Button>
          <Button variant="ghost" size="sm" onClick={onDelete}>
            Delete
          </Button>
        </div>
      ) : null}
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
  const showHints = showWriteHints && !loading && !ownReview && !canWrite;

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
      className="mt-12 w-full scroll-mt-[calc(var(--header-h)+1.5rem)] sm:mt-16"
    >
      <SectionHeader
        title="Reviews"
        count={reviews.length || undefined}
        actions={
          ownReview ? (
            <Button
              variant="border"
              size="sm"
              onClick={onEdit}
              iconLeft={<LuPencil size={14} />}
            >
              Edit review
            </Button>
          ) : canWrite ? (
            <Button
              variant="primary"
              size="sm"
              onClick={onWrite}
              iconLeft={<LuPencil size={14} />}
            >
              Write a review
            </Button>
          ) : undefined
        }
      />

      {showHints ? (
        <div className="mb-4 flex items-start gap-3 rounded-2xl bg-ink/[0.04] px-4 py-3.5 text-sm text-ink-2">
          <LuLock size={16} className="mt-0.5 shrink-0 text-ink-3" />
          {!isSignedIn ? (
            <p>
              <Link
                href={loginHref}
                className="font-medium text-ink underline underline-offset-2"
              >
                Sign in
              </Link>{" "}
              and rate every track to review this {releaseLabel}.
            </p>
          ) : !isFullyRated ? (
            <p>
              Rate all {totalTracks} tracks to unlock your review
              {totalTracks > 0 ? (
                <span className="text-ink-3">
                  {" "}
                  ({ratedTracksCount}/{totalTracks} done)
                </span>
              ) : null}
              .
            </p>
          ) : null}
        </div>
      ) : null}

      {loading && reviews.length === 0 ? (
        <div className="flex flex-col gap-3">
          {[0, 1].map((key) => (
            <div key={key} className="rounded-2xl bg-surface p-5 shadow-card sm:p-6">
              <div className="flex items-center gap-3">
                <Skeleton className="size-10 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-3.5 w-28" />
                  <Skeleton className="h-3 w-20" />
                </div>
              </div>
              <Skeleton className="mt-5 h-14 w-full" />
            </div>
          ))}
        </div>
      ) : reviews.length === 0 ? (
        <EmptyState
          compact
          icon={<LuMessageSquare size={20} />}
          title="No reviews yet"
          description={`Reviews unlock once someone rates every track of this ${releaseLabel}.`}
        />
      ) : (
        <div className="flex flex-col gap-3">
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
