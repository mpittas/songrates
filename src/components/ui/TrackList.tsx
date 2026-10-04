import { Children, type ReactNode } from "react";

import { cn } from "@/lib/utils";

const PANEL = "overflow-hidden bg-surface shadow-card divide-y divide-line";

/**
 * White panel that holds song rows separated by hairlines. With `columns={2}`
 * the rows split into two side-by-side panels on large screens (column-major,
 * so rankings read 1–5 then 6–10) and stay one continuous list on phones.
 */
export default function TrackList({
  children,
  columns = 1,
  className,
}: {
  children: ReactNode;
  columns?: 1 | 2;
  className?: string;
}) {
  const rows = Children.toArray(children);

  // Splitting fewer than six rows leaves lopsided panels; keep them stacked.
  if (columns === 1 || rows.length < 6) {
    return <div className={cn(PANEL, "rounded-2xl", className)}>{rows}</div>;
  }

  const half = Math.ceil(rows.length / 2);

  return (
    <div
      className={cn("grid lg:grid-cols-2 lg:items-start lg:gap-5", className)}
    >
      <div className={cn(PANEL, "rounded-t-2xl lg:rounded-2xl")}>
        {rows.slice(0, half)}
      </div>
      <div
        className={cn(
          PANEL,
          "rounded-b-2xl border-t border-line lg:rounded-2xl lg:border-t-0",
        )}
      >
        {rows.slice(half)}
      </div>
    </div>
  );
}
