import { cn } from "@/lib/utils";

/** Base shimmer block. Size it with className. */
export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn("animate-pulse rounded-md bg-ink/[0.07]", className)}
    />
  );
}

export function SectionHeaderSkeleton({
  eyebrow = true,
  className,
}: {
  eyebrow?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("mb-5 sm:mb-6", className)}>
      {eyebrow ? <Skeleton className="mb-3 h-3 w-24" /> : null}
      <Skeleton className="h-7 w-56 max-w-[70%]" />
    </div>
  );
}

export function TrackRowSkeleton() {
  return (
    <div className="flex items-center gap-3 py-2 pr-2 pl-3 sm:gap-4 sm:py-2.5 sm:pr-3 sm:pl-4">
      <Skeleton className="h-3 w-5 sm:w-6" />
      <Skeleton className="size-11 shrink-0 sm:size-12" />
      <div className="min-w-0 flex-1 space-y-2">
        <Skeleton className="h-3.5 w-2/5" />
        <Skeleton className="h-3 w-3/5" />
      </div>
      <Skeleton className="size-8 shrink-0 rounded-full" />
    </div>
  );
}

export function TrackListSkeleton({
  rows = 8,
  columns = 1,
}: {
  rows?: number;
  columns?: 1 | 2;
}) {
  const panel = (count: number, className?: string) => (
    <div
      className={cn(
        "divide-y divide-line overflow-hidden bg-surface shadow-card",
        className,
      )}
    >
      {Array.from({ length: count }).map((_, i) => (
        <TrackRowSkeleton key={i} />
      ))}
    </div>
  );

  if (columns === 1) return panel(rows, "rounded-2xl");

  const half = Math.ceil(rows / 2);
  return (
    <div className="grid lg:grid-cols-2 lg:items-start lg:gap-5">
      {panel(half, "rounded-t-2xl lg:rounded-2xl")}
      {panel(rows - half, "rounded-b-2xl border-t border-line lg:rounded-2xl lg:border-t-0")}
    </div>
  );
}

export function CardSkeleton({ circle = false }: { circle?: boolean }) {
  return (
    <div className={cn("min-w-0", circle && "flex flex-col items-center")}>
      <Skeleton
        className={cn(
          "aspect-square w-full",
          circle ? "max-w-[180px] rounded-full" : "rounded-xl",
        )}
      />
      <Skeleton className="mt-3 h-3.5 w-3/4" />
      <Skeleton className="mt-2 h-3 w-1/2" />
    </div>
  );
}

const GRID_COLUMNS = {
  4: "grid-cols-2 md:grid-cols-4",
  5: "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5",
  6: "grid-cols-2 sm:grid-cols-3 lg:grid-cols-6",
} as const;

export function CardGridSkeleton({
  count = 6,
  columns = 6,
  circle = false,
}: {
  count?: number;
  columns?: keyof typeof GRID_COLUMNS;
  circle?: boolean;
}) {
  return (
    <div className={cn("grid gap-x-4 gap-y-8 md:gap-x-5", GRID_COLUMNS[columns])}>
      {Array.from({ length: count }).map((_, i) => (
        <CardSkeleton key={i} circle={circle} />
      ))}
    </div>
  );
}
