import { Children, type ReactNode } from "react";

import { cn } from "@/lib/utils";

const DESKTOP_COLUMNS = {
  2: "md:grid-cols-2",
  3: "md:grid-cols-3",
  4: "md:grid-cols-4",
  5: "md:grid-cols-4 lg:grid-cols-5",
  6: "md:grid-cols-3 lg:grid-cols-6",
} as const;

const MOBILE_ITEM_WIDTH = {
  narrow: "w-[38%] sm:w-[28%]",
  default: "w-[44%] sm:w-[30%]",
  wide: "w-[86%] sm:w-[60%]",
} as const;

/**
 * Swipeable row on phones, regular grid from `md` up. Bleeds to the screen
 * edge on mobile so the next card peeks in and signals the row scrolls.
 */
export default function CardRail({
  children,
  columns = 5,
  itemWidth = "default",
  className,
}: {
  children: ReactNode;
  columns?: keyof typeof DESKTOP_COLUMNS;
  itemWidth?: keyof typeof MOBILE_ITEM_WIDTH;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "scrollbar-none -mx-4 flex snap-x snap-mandatory scroll-px-4 gap-3 overflow-x-auto px-4 pb-2",
        "sm:-mx-6 sm:scroll-px-6 sm:gap-4 sm:px-6",
        "md:mx-0 md:grid md:gap-x-5 md:gap-y-8 md:overflow-visible md:px-0 md:pb-0",
        DESKTOP_COLUMNS[columns],
        className,
      )}
    >
      {Children.toArray(children).map((child, index) => (
        <div
          key={index}
          className={cn(
            "shrink-0 snap-start md:w-auto",
            MOBILE_ITEM_WIDTH[itemWidth],
          )}
        >
          {child}
        </div>
      ))}
    </div>
  );
}
