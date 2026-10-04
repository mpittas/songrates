import type { ReactNode } from "react";
import { LuGlobe, LuUserRound } from "react-icons/lu";

import { ratingColor } from "@/components/rating/constants";
import { cn } from "@/lib/utils";
import type { PublicAlbumRating } from "@/types/music";

function RatingStatCard({
  icon,
  label,
  score,
  detail,
  progress,
}: {
  icon: ReactNode;
  label: ReactNode;
  score: number | null;
  detail: ReactNode;
  /** 0–1 completion, renders a bar under the detail line. */
  progress?: number;
}) {
  const hasScore = score != null && score > 0;

  return (
    <div className="flex flex-col rounded-2xl bg-surface p-4 shadow-card sm:p-5">
      <div className="flex items-center gap-2 text-ink-2">
        <span className="flex size-6 items-center justify-center rounded-full bg-ink/[0.06] text-ink-2">
          {icon}
        </span>
        <span className="eyebrow truncate">{label}</span>
      </div>

      <div className="mt-3 flex items-end gap-1.5 sm:mt-4">
        <span
          className={cn(
            "font-display text-[2.25rem] leading-none font-semibold tracking-[-0.04em] tabular-nums sm:text-5xl",
            !hasScore && "text-ink-3",
          )}
          style={hasScore ? { color: ratingColor(score) } : undefined}
        >
          {hasScore ? score.toFixed(1) : "–"}
        </span>
        {hasScore ? (
          <span className="mb-1 text-sm font-medium text-ink-3">/10</span>
        ) : null}
      </div>

      <p className="mt-2 text-[13px] leading-5 text-ink-2 sm:text-sm">
        {detail}
      </p>

      {progress != null ? (
        <div
          className="mt-3 h-1.5 overflow-hidden rounded-full bg-ink/[0.07]"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(progress * 100)}
          aria-label="Tracks rated"
        >
          <div
            className="h-full rounded-full bg-ink transition-[width] duration-500 ease-out"
            style={{ width: `${Math.min(100, Math.max(0, progress * 100))}%` }}
          />
        </div>
      ) : null}
    </div>
  );
}

export interface AlbumRatingRowSectionProps {
  publicData: PublicAlbumRating | null | undefined;
  viewingUserRatings: Record<string, number> | null;
  viewingUserName: string | null;
  averageScore: string | number;
  isFullyRated: boolean;
  ratedTracksCount: number;
  totalTracks: number;
}

export default function AlbumRatingRowSection({
  publicData,
  viewingUserRatings,
  viewingUserName,
  averageScore,
  isFullyRated,
  ratedTracksCount,
  totalTracks,
}: AlbumRatingRowSectionProps) {
  const personalLabel = viewingUserRatings
    ? viewingUserName
      ? `@${viewingUserName}`
      : "Their score"
    : "Your score";

  const personalScore = parseFloat(String(averageScore)) || null;

  const personalDetail = isFullyRated
    ? "Every track rated"
    : totalTracks > 0
      ? `${ratedTracksCount} of ${totalTracks} tracks rated`
      : "Rate tracks below";

  const publicUserCount = publicData?.ratingCount ?? 0;
  const publicDetail =
    publicUserCount > 0
      ? `From ${publicUserCount} ${publicUserCount === 1 ? "listener" : "listeners"}`
      : "No community ratings yet";

  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4">
      <RatingStatCard
        icon={<LuGlobe size={13} />}
        label="Community"
        score={publicData?.averageRating ?? null}
        detail={publicDetail}
      />
      <RatingStatCard
        icon={<LuUserRound size={13} />}
        label={personalLabel}
        score={personalScore}
        detail={personalDetail}
        progress={totalTracks > 0 ? ratedTracksCount / totalTracks : undefined}
      />
    </div>
  );
}
