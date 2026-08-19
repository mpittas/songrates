import { cn } from "@/lib/utils";
import { MAX_LEVEL, rankForLevel } from "@/lib/profileProgression";

export type RankBadgeState = "locked" | "earned" | "current";
export type RankBadgeSize = "sm" | "md" | "lg";

const SIZE_CLASS: Record<RankBadgeSize, string> = {
  sm: "size-7",
  md: "size-11",
  lg: "size-[4.75rem] sm:size-24",
};

type RankMetal = {
  fill: string;
  rim: string;
  hole: string;
  mark: string;
};

const METALS: Record<number, RankMetal> = {
  1: {
    fill: "#6f6a64",
    rim: "#c9c3bb",
    hole: "#2a2826",
    mark: "#f4f0ea",
  },
  2: {
    fill: "#b56a3c",
    rim: "#e8c4a4",
    hole: "#3a1c10",
    mark: "#fff4ea",
  },
  3: {
    fill: "#2f7fa3",
    rim: "#b9dcea",
    hole: "#0c2433",
    mark: "#f3fbff",
  },
  4: {
    fill: "#c49a1c",
    rim: "#f0e0a0",
    hole: "#3a2c08",
    mark: "#fffbeb",
  },
  5: {
    fill: "#4a2d5c",
    rim: "#d4b8e8",
    hole: "#140c18",
    mark: "#f8ecff",
  },
};

function clampLevel(level: number): number {
  if (!Number.isFinite(level) || level < 1) return 0;
  return Math.min(MAX_LEVEL, Math.trunc(level));
}

function RankMark({ level }: { level: number }) {
  switch (level) {
    case 2:
      return <path d="M16 16 L22.2 11" />;
    case 3:
      return <circle cx="16" cy="16" r="5.6" />;
    case 4:
      return (
        <>
          <path d="M16 16 L22.6 9.8" />
          <circle cx="22.8" cy="9.6" r="1.05" />
        </>
      );
    case 5:
      return (
        <>
          <path d="M16 8.2 V12" />
          <path d="M16 20 V23.8" />
          <path d="M8.2 16 H12" />
          <path d="M20 16 H23.8" />
        </>
      );
    default:
      return null;
  }
}

export default function RankBadge({
  level,
  state,
  size = "md",
  decorative = false,
  className,
}: {
  level: number;
  state: RankBadgeState;
  size?: RankBadgeSize;
  decorative?: boolean;
  className?: string;
}) {
  const clamped = clampLevel(level);
  const unranked = clamped < 1;
  const metal = METALS[unranked ? 1 : clamped];
  const rank = rankForLevel(clamped);
  const filled = state !== "locked" && !unranked;
  const label = unranked
    ? `Unranked${state === "current" ? ", current rank" : ""}`
    : `${rank}, level ${clamped}${state === "current" ? ", current rank" : state === "locked" ? ", locked" : ""}`;

  return (
    <span
      className={cn(
        "relative inline-flex shrink-0 items-center justify-center",
        SIZE_CLASS[size],
        className,
      )}
      aria-hidden={decorative}
      aria-label={decorative ? undefined : label}
      role={decorative ? undefined : "img"}
    >
      <svg
        viewBox="0 0 32 32"
        className="size-full"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {filled ? (
          <>
            <circle
              cx="16"
              cy="16"
              r="13.2"
              fill={metal.fill}
              stroke={metal.rim}
              strokeWidth={1.15}
            />
            {size !== "sm" ? (
              <circle
                cx="16"
                cy="16"
                r="9.1"
                stroke={metal.hole}
                strokeOpacity={0.22}
                strokeWidth={0.7}
              />
            ) : null}
            <circle cx="16" cy="16" r="1.5" fill={metal.hole} />
            <g
              fill="none"
              stroke={metal.mark}
              strokeWidth={1.45}
              strokeOpacity={0.9}
            >
              <RankMark level={clamped} />
            </g>
          </>
        ) : (
          <>
            <circle
              cx="16"
              cy="16"
              r="12.6"
              stroke={metal.fill}
              strokeOpacity={0.45}
              strokeWidth={1.4}
            />
            <circle
              cx="16"
              cy="16"
              r="1.4"
              fill={metal.fill}
              fillOpacity={0.4}
            />
            <g
              fill="none"
              stroke={metal.fill}
              strokeOpacity={0.4}
              strokeWidth={1.4}
            >
              <RankMark level={clamped} />
            </g>
          </>
        )}
      </svg>
    </span>
  );
}

export function RankGoalTicks({
  total,
  filled,
}: {
  total: number;
  filled: number;
}) {
  if (total < 1 || total > 9) return null;

  return (
    <ul className="flex flex-wrap items-center gap-1.5" aria-hidden>
      {Array.from({ length: total }, (_, index) => (
        <li
          key={index}
          className={cn(
            "size-2.5 rounded-full",
            index < filled
              ? "bg-neutral-900"
              : "border border-neutral-500 bg-transparent",
          )}
        />
      ))}
    </ul>
  );
}
