"use client";

import Button from "@/components/ui/Button";
import { cn } from "@/lib/utils";

export interface FilterChip {
  key: string;
  label: string;
  /** Render as a link instead of calling `onChange`. */
  href?: string;
  count?: number;
}

/**
 * Pill filters. Swipeable and pinned under the header on phones, wrapping on
 * larger screens.
 */
export default function FilterChips({
  items,
  activeKey,
  onChange,
  ariaLabel,
  sticky = true,
  className,
}: {
  items: FilterChip[];
  activeKey: string | null;
  onChange?: (key: string) => void;
  ariaLabel: string;
  sticky?: boolean;
  className?: string;
}) {
  return (
    <nav
      aria-label={ariaLabel}
      className={cn(
        sticky &&
          "max-md:sticky max-md:top-(--header-h) max-md:z-30 max-md:-mx-4 max-md:bg-canvas/85 max-md:px-4 max-md:py-3 max-md:backdrop-blur-xl max-md:backdrop-saturate-150 sm:max-md:-mx-6 sm:max-md:px-6",
        className,
      )}
    >
      <div className="scrollbar-none -mx-4 flex gap-2 overflow-x-auto px-4 sm:-mx-6 sm:px-6 md:mx-0 md:flex-wrap md:overflow-visible md:px-0">
        {items.map((item) => {
          const active = item.key === activeKey;
          const label = (
            <>
              {item.label}
              {item.count != null ? (
                <span
                  className={cn(
                    "tabular-nums",
                    active ? "text-white/60" : "text-ink-3",
                  )}
                >
                  {item.count}
                </span>
              ) : null}
            </>
          );

          return (
            <Button
              key={item.key}
              href={item.href}
              onClick={item.href ? undefined : () => onChange?.(item.key)}
              variant={active ? "primary" : "border"}
              size="sm"
              aria-pressed={item.href ? undefined : active}
              aria-current={item.href && active ? "page" : undefined}
            >
              {label}
            </Button>
          );
        })}
      </div>
    </nav>
  );
}
