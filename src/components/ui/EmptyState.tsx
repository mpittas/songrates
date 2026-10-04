import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

/** Calm placeholder for empty lists, missing data and zero-result filters. */
export default function EmptyState({
  icon,
  title,
  description,
  action,
  compact = false,
  className,
}: {
  icon?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  /** Tighter padding for inline use inside sections. */
  compact?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center rounded-2xl border border-dashed border-line-strong text-center",
        compact ? "px-6 py-8" : "px-6 py-14 sm:py-16",
        className,
      )}
    >
      {icon ? (
        <div className="mb-4 flex size-12 items-center justify-center rounded-full bg-surface text-ink-2 shadow-card">
          {icon}
        </div>
      ) : null}
      <h2 className="font-display text-lg font-semibold tracking-[-0.02em] text-ink">
        {title}
      </h2>
      {description ? (
        <p className="mt-1.5 max-w-md text-sm leading-6 text-ink-2">
          {description}
        </p>
      ) : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}
