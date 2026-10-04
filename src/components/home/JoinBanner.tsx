"use client";

import Button from "@/components/ui/Button";
import MySection from "@/components/ui/MySection";
import { useAuth } from "@/context/AuthContext";
import {
  ALBUMS_FOR_LEVEL,
  MAX_LEVEL,
  RANKS,
  REVIEWS_FOR_LEVEL,
} from "@/lib/profileProgression";
import { cn } from "@/lib/utils";

const LEVELS = Array.from({ length: MAX_LEVEL }, (_, i) => i + 1);

function requirement(level: number) {
  const albums = `${ALBUMS_FOR_LEVEL[level]} albums`;
  const reviews = REVIEWS_FOR_LEVEL[level];
  if (!reviews) return albums;
  return `${albums} + ${reviews} review${reviews === 1 ? "" : "s"}`;
}

/** Sign-up pitch for logged-out visitors, built around the rank ladder. */
export default function JoinBanner() {
  const { user, loading } = useAuth();
  if (loading || user) return null;

  return (
    <MySection className="py-10 sm:py-14">
      <div className="relative isolate overflow-hidden rounded-[28px] bg-[#0c0b0a] px-6 py-10 text-white sm:rounded-[32px] sm:px-12 sm:py-14">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(60%_80%_at_100%_0%,rgb(226_83_27/0.22),transparent_60%),radial-gradient(50%_60%_at_0%_100%,rgb(255_255_255/0.06),transparent_70%)]"
        />

        <div className="grid gap-10 lg:grid-cols-[1.05fr_1fr] lg:items-center lg:gap-16">
          <div>
            <p className="eyebrow text-white/50">Join songrates</p>
            <h2 className="mt-4 font-display text-[2.5rem] leading-[1] font-semibold tracking-[-0.045em] text-balance sm:text-6xl">
              Your taste, scored.
            </h2>
            <p className="mt-5 max-w-md text-[15px] leading-6 text-white/60 sm:text-base">
              Rate every track, finish albums, write reviews, and climb the
              ranks from Listener to Legend.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button href="/login?view=signup" variant="white" size="lg">
                Create your profile
              </Button>
              <Button href="/explore" variant="whiteMuted" size="lg">
                Browse music
              </Button>
            </div>
          </div>

          <ol className="flex flex-col gap-2" aria-label="Profile ranks">
            {LEVELS.map((level) => {
              const isTop = level === MAX_LEVEL;
              return (
                <li
                  key={level}
                  className={cn(
                    "flex items-center gap-4 rounded-2xl border px-4 py-3",
                    isTop
                      ? "border-accent/40 bg-accent/[0.12]"
                      : "border-white/10 bg-white/[0.04]",
                  )}
                >
                  <span
                    className={cn(
                      "flex size-9 shrink-0 items-center justify-center rounded-full font-display text-sm font-semibold tabular-nums",
                      isTop ? "bg-accent text-white" : "bg-white/10 text-white/90",
                    )}
                  >
                    {level}
                  </span>
                  <span className="min-w-0 flex-1 truncate font-medium">
                    {RANKS[level]}
                  </span>
                  <span className="shrink-0 text-xs text-white/50 tabular-nums">
                    {requirement(level)}
                  </span>
                </li>
              );
            })}
          </ol>
        </div>
      </div>
    </MySection>
  );
}
