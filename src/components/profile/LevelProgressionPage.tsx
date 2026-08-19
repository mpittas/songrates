"use client";

import { useEffect, useState } from "react";
import InstantLink from "@/components/ui/InstantLink";
import OptimizedImage from "@/components/ui/OptimizedImage";
import Button from "@/components/ui/Button";
import RankBadge, { RankGoalTicks } from "@/components/profile/RankBadge";
import { useOwnProgression } from "@/components/profile/useOwnProgression";
import { cn, createSlug } from "@/lib/utils";
import {
  completingAlbumWouldReachLevel,
  formatRemainingToGoal,
  getRankLadder,
  MAX_LEVEL,
  remainingToLevel,
  type IncompleteAlbumProgress,
  type Perk,
  type ProgressionView,
  type RankLadderStep,
} from "@/lib/profileProgression";

const LADDER = getRankLadder();

function badgeState(
  level: number,
  currentLevel: number,
): "locked" | "earned" | "current" {
  if (level === currentLevel) return "current";
  if (level < currentLevel) return "earned";
  return "locked";
}

function ProgressBar({
  value,
  max,
  percent,
  label,
}: {
  value: number;
  max: number;
  percent: number;
  label: string;
}) {
  return (
    <div
      className="h-1 overflow-hidden rounded-full bg-neutral-200"
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={value}
      aria-label={label}
    >
      <div
        className="h-full rounded-full bg-neutral-900 motion-safe:transition-[width] motion-safe:duration-500 motion-safe:ease-out"
        style={{ width: `${percent}%` }}
      />
    </div>
  );
}

function FinishAlbumRow({
  album,
  wouldLevelUp,
}: {
  album: IncompleteAlbumProgress;
  wouldLevelUp: boolean;
}) {
  const href = `/album/${createSlug(album.title, album.id)}`;
  const remainingLabel =
    album.remainingTracks === 1
      ? "1 track left"
      : `${album.remainingTracks} tracks left`;

  return (
    <li>
      <InstantLink
        href={href}
        className="group -mx-2 flex items-center gap-3 rounded-md px-2 py-3 transition-colors hover:bg-white/70 focus-visible:bg-white/70"
      >
        <div className="relative size-12 shrink-0 overflow-hidden rounded-sm bg-neutral-200 sm:size-14">
          {album.artworkUrl ? (
            <OptimizedImage
              src={album.artworkUrl}
              alt=""
              fill
              className="object-cover"
              fallbackSrc="/vinyl-placeholder.svg"
            />
          ) : (
            <div className="h-full w-full bg-neutral-200" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-neutral-900 group-hover:underline">
            {album.title}
          </p>
          <p className="truncate text-sm text-neutral-500">{album.artistName}</p>
          <div className="mt-1.5 flex items-center gap-2">
            <div
              className="h-0.5 w-20 overflow-hidden rounded-full bg-neutral-200 sm:w-28"
              aria-hidden
            >
              <div
                className="h-full bg-neutral-800"
                style={{ width: `${album.progressPercent}%` }}
              />
            </div>
            <span className="text-xs tabular-nums text-neutral-500">
              {album.ratedCount}/{album.totalTracks} · {remainingLabel}
            </span>
          </div>
        </div>
        {wouldLevelUp ? (
          <p className="shrink-0 text-xs font-medium text-neutral-900">
            Gets you there
          </p>
        ) : null}
      </InstantLink>
    </li>
  );
}

function perkLine(perk: Perk, unlocked: boolean): string {
  const soon = perk.status === "coming_soon" ? " Coming soon." : "";
  if (unlocked) return `${perk.name}. ${perk.summary}${soon}`;
  return `Unlocks ${perk.name}. ${perk.summary}${soon}`;
}

function SelectedRank({
  step,
  view,
}: {
  step: RankLadderStep;
  view: ProgressionView;
}) {
  const reached = step.level <= view.level;
  const isCurrent = step.level === view.level;
  const remaining = remainingToLevel(
    view.fullyRatedCount,
    view.reviewCount,
    step.level,
  );
  let goal: string;
  if (isCurrent) {
    goal = view.isMaxLevel ? "Highest rank." : "Your rank.";
  } else if (reached) {
    goal = "Reached.";
  } else {
    goal = `${formatRemainingToGoal(remaining, "unlock") ?? "Unlock"}.`;
  }

  return (
    <div className="mt-4 min-h-18">
      <p className="font-medium tracking-tight text-neutral-900">{step.rank}</p>
      <p className="mt-1 text-sm leading-relaxed text-neutral-600">{goal}</p>
      {step.perks.map((perk) => (
        <p
          key={perk.id}
          className="mt-0.5 text-sm leading-relaxed text-neutral-500"
        >
          {perkLine(perk, reached)}
        </p>
      ))}
    </div>
  );
}

export default function LevelProgressionPage({
  compact = false,
}: {
  compact?: boolean;
}) {
  const { view, incompleteAlbums } = useOwnProgression();
  const [selectedLevel, setSelectedLevel] = useState(
    view.level < 1 ? 1 : view.level,
  );
  const selected =
    LADDER.find((step) => step.level === selectedLevel) ?? LADDER[0];
  const sectionGap = compact ? "mt-8" : "mt-12";
  const nextLevelHeading =
    view.albumsToNextLevel > 0
      ? view.albumsToNextLevel === 1
        ? `Rate 1 more album to reach level ${view.nextLevel}`
        : `Rate ${view.albumsToNextLevel} more albums to reach level ${view.nextLevel}`
      : (formatRemainingToGoal(
          remainingToLevel(
            view.fullyRatedCount,
            view.reviewCount,
            view.nextLevel,
          ),
          `reach level ${view.nextLevel}`,
        ) ?? `Reach level ${view.nextLevel}`);

  useEffect(() => {
    setSelectedLevel(view.level < 1 ? 1 : view.level);
  }, [view.level]);

  return (
    <div className={compact ? undefined : "max-w-2xl pb-8"}>
      <header className="flex items-start gap-5 sm:gap-6">
        <RankBadge
          level={view.level}
          state="current"
          size="lg"
          className="mt-1 motion-safe:animate-fade-in-up"
        />
        <div className="min-w-0 flex-1">
          <p className="text-3xl font-semibold tracking-tight text-neutral-900 sm:text-4xl">
            {view.rank}
          </p>
          <p className="mt-1 text-sm text-neutral-500">
            {view.isUnranked
              ? "Unranked"
              : `Level ${view.level} of ${MAX_LEVEL}`}
            {view.fullyRatedCount > 0 ? (
              <>
                {" "}
                · {view.fullyRatedCount} fully rated{" "}
                {view.fullyRatedCount === 1 ? "album" : "albums"}
              </>
            ) : null}
            {view.reviewCount > 0 ? (
              <>
                {" "}
                · {view.reviewCount}{" "}
                {view.reviewCount === 1 ? "review" : "reviews"}
              </>
            ) : null}
          </p>

          {view.isMaxLevel ? (
            <p className="mt-5 max-w-xl text-base leading-relaxed text-neutral-600">
              You have reached Legend. Keep rating — unrating a release can drop
              you down.
            </p>
          ) : (
            <div className="mt-5 max-w-xl">
              <p className="text-lg font-medium tracking-tight text-neutral-900">
                {view.hint}.
              </p>
              <div className="mt-3">
                {view.albumsToNextLevel > 0 && view.stepAlbums <= 9 ? (
                  <RankGoalTicks
                    total={view.stepAlbums}
                    filled={view.stepAlbumsDone}
                  />
                ) : view.reviewsToNextLevel > 0 &&
                  view.reviewCount + view.reviewsToNextLevel <= 9 ? (
                  <RankGoalTicks
                    total={view.reviewCount + view.reviewsToNextLevel}
                    filled={view.reviewCount}
                  />
                ) : (
                  <ProgressBar
                    value={view.albumsIntoLevel}
                    max={view.albumsForNextLevel}
                    percent={view.progressPercent}
                    label={`Progress to ${view.nextRank}`}
                  />
                )}
              </div>
            </div>
          )}
        </div>
      </header>

      <section className={sectionGap}>
        <h3 className="text-xl font-semibold tracking-tight text-neutral-900">
          Badges
        </h3>
        <div
          className="mt-4 grid grid-cols-5 gap-1 sm:gap-2"
          role="group"
          aria-label="Ranks"
        >
          {LADDER.map((step) => {
            const isSelected = step.level === selectedLevel;
            const isCurrent = step.level === view.level;
            const isNext =
              !view.isMaxLevel && step.level === view.nextLevel;
            return (
              <button
                key={step.level}
                type="button"
                aria-label={`${step.rank}, level ${step.level}${isCurrent ? ", current" : isNext ? ", next rank" : ""}`}
                aria-pressed={isSelected}
                title={step.rank}
                onClick={() => setSelectedLevel(step.level)}
                className={cn(
                  "flex min-h-11 cursor-pointer items-center justify-center rounded-full p-1.5 transition-colors hover:bg-neutral-900/5 focus-visible:bg-neutral-900/5",
                  isSelected && "bg-neutral-900/10",
                )}
              >
                <RankBadge
                  level={step.level}
                  state={badgeState(step.level, view.level)}
                  size="md"
                  decorative
                />
              </button>
            );
          })}
        </div>
        <SelectedRank step={selected} view={view} />
      </section>

      {!view.isMaxLevel ? (
        <section className={sectionGap}>
          <h3 className="text-xl font-semibold tracking-tight text-neutral-900">
            {nextLevelHeading}
          </h3>
          {incompleteAlbums.length > 0 ? (
            <ul className="mt-3 divide-y divide-neutral-200/80 border-y border-neutral-200/80">
              {incompleteAlbums.map((album) => (
                <FinishAlbumRow
                  key={album.id}
                  album={album}
                  wouldLevelUp={completingAlbumWouldReachLevel(
                    view.fullyRatedCount,
                    view.reviewCount,
                    view.nextLevel,
                  )}
                />
              ))}
            </ul>
          ) : (
            <div className="mt-3">
              <p className="text-sm leading-relaxed text-neutral-600">
                Open an album and rate every track to earn this rank.
              </p>
              <div className="mt-4">
                <Button href="/explore" variant="primary" size="sm">
                  Find an album
                </Button>
              </div>
            </div>
          )}
        </section>
      ) : null}

      <p
        className={cn(
          sectionGap,
          "max-w-xl text-sm leading-relaxed text-neutral-500",
        )}
      >
        Rate every track on a release to count it. Selector and Legend also
        need written album reviews. Unrating a track or deleting a review can
        drop your rank.
      </p>
    </div>
  );
}
