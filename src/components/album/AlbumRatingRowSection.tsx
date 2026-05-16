import type { ReactNode } from "react";
import { FaGlobeAmericas, FaUser } from "react-icons/fa";

import { cn } from "@/lib/utils";
import type { PublicAlbumRating } from "@/types/music";

function RatingStatIcon({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-neutral-800 text-neutral-400">
      {children}
    </div>
  );
}

function RatingStatMeta({
  label,
  detail,
}: {
  label: string;
  detail: ReactNode;
}) {
  return (
    <div className="flex flex-col text-left">
      <span className="text-xs text-neutral-400">{label}</span>
      <span className="mt-0.5 text-md text-white">{detail}</span>
    </div>
  );
}

function RatingStatTile({
  icon,
  label,
  detail,
  score,
  className,
}: {
  icon: ReactNode;
  label: string;
  detail: ReactNode;
  score: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex items-center justify-between bg-neutral-900 p-4",
        className,
      )}
    >
      <div className="flex items-center gap-4">
        <RatingStatIcon>{icon}</RatingStatIcon>
        <RatingStatMeta label={label} detail={detail} />
      </div>
      <div className="ml-6 text-3xl p-2 bg-neutral-950 rounded-lg leading-6 text-neutral-200">{score}</div>
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
      ? viewingUserName
      : "User"
    : "You";

  const hasPersonalAverage =
    Boolean(averageScore) && parseFloat(String(averageScore)) > 0;

  const personalDetail = hasPersonalAverage
    ? isFullyRated
      ? "Completed"
      : `${ratedTracksCount}/${totalTracks} rated`
    : "Rate below";

  const publicDetail = publicData?.ratingCount
    ? `from ${publicData.ratingCount} users`
    : "No ratings";

  const publicScore = publicData?.averageRating
    ? publicData.averageRating.toFixed(1)
    : "-";

  const personalScore = hasPersonalAverage ? averageScore : "-";

  return (
    <div className="mb-8 grid w-full grid-cols-1 md:grid-cols-2">
      <RatingStatTile
        className="rounded-l-xl"
        icon={<FaGlobeAmericas size={14} />}
        label="Public rating"
        detail={publicDetail}
        score={publicScore}
      />
      <RatingStatTile
        className="rounded-r-xl border-l border-white/10"
        icon={<FaUser size={14} />}
        label={personalDetail}
        detail={personalLabel}
        score={personalScore}
      />
    </div>
  );
}
