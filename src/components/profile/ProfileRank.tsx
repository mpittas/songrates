import Link from "next/link";
import RankBadge from "@/components/profile/RankBadge";
import { cn } from "@/lib/utils";
import type { ProgressionView } from "@/lib/profileProgression";

export default function ProfileRank({
  view,
  showProgress = false,
  href,
  onClick,
  className,
}: {
  view: ProgressionView;
  showProgress?: boolean;
  href?: string;
  onClick?: () => void;
  className?: string;
}) {
  const body = (
    <div className="flex w-full items-center gap-2.5">
      <RankBadge
        level={view.level}
        state="current"
        size="sm"
        decorative
      />
      <div className="min-w-0">
        <p className="text-xs font-medium tracking-wide text-neutral-700">
          {view.rank}
        </p>
        {showProgress ? (
          <>
            {!view.isMaxLevel ? (
              <div
                className="mt-1.5 h-0.5 overflow-hidden rounded-full bg-neutral-200"
                role="progressbar"
                aria-valuemin={0}
                aria-valuemax={view.albumsForNextLevel}
                aria-valuenow={view.albumsIntoLevel}
                aria-label={`Progress to ${view.nextRank}`}
              >
                <div
                  className="h-full rounded-full bg-neutral-800"
                  style={{ width: `${view.progressPercent}%` }}
                />
              </div>
            ) : null}
            <p className="mt-1 text-xs leading-snug text-neutral-500 transition-colors group-hover:text-neutral-800">
              {view.goalShort ?? "View badges"}
            </p>
          </>
        ) : null}
      </div>
    </div>
  );

  const label = view.goalShort
    ? `${view.rank}. ${view.goalShort}.`
    : view.isUnranked
      ? "Unranked."
      : `${view.rank}, level ${view.level}.`;
  const sharedClassName = cn(
    "group block max-w-xs rounded-sm outline-offset-4",
    className,
  );

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={cn(sharedClassName, "cursor-pointer text-left")}
        aria-label={label}
      >
        {body}
      </button>
    );
  }

  if (href) {
    return (
      <Link href={href} className={sharedClassName} aria-label={label}>
        {body}
      </Link>
    );
  }

  return <div className={cn("max-w-xs", className)}>{body}</div>;
}
