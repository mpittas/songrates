import type { ReactNode } from "react";
import { LuArrowRight } from "react-icons/lu";

import Button from "@/components/ui/Button";
import { cn } from "@/lib/utils";

export interface SectionHeaderProps {
  title: ReactNode;
  /** Small uppercase label above the title. */
  eyebrow?: ReactNode;
  description?: ReactNode;
  /** Muted number rendered after the title. */
  count?: number;
  /** Adds a "See all" link on the right. */
  href?: string;
  linkLabel?: string;
  /** Custom right-hand content (buttons, filters). Replaces the link. */
  actions?: ReactNode;
  as?: "h1" | "h2" | "h3";
  /** `sm` for nested sub-sections (genre rows, profile groups). */
  size?: "sm" | "md";
  className?: string;
  id?: string;
}

/**
 * The one heading style for every content section on the site
 * (home rails, album tracklists, artist discography, profile tabs…).
 */
export default function SectionHeader({
  title,
  eyebrow,
  description,
  count,
  href,
  linkLabel = "See all",
  actions,
  as: Heading = "h2",
  size = "md",
  className,
  id,
}: SectionHeaderProps) {
  const trailing =
    actions ??
    (href ? (
      <Button
        href={href}
        variant="ghost"
        size="sm"
        className="-mr-2"
        iconRight={<LuArrowRight size={15} />}
      >
        {linkLabel}
      </Button>
    ) : null);

  return (
    <div className={cn(size === "sm" ? "mb-4" : "mb-5 sm:mb-6", className)}>
      {eyebrow ? <p className="eyebrow mb-2 text-ink-3">{eyebrow}</p> : null}
      <div className="flex items-end justify-between gap-4">
        <Heading
          id={id}
          className={cn(
            "min-w-0 font-display leading-[1.15] font-semibold text-balance text-ink",
            size === "sm"
              ? "text-lg tracking-[-0.025em] sm:text-xl"
              : "text-[1.375rem] tracking-[-0.03em] sm:text-[1.625rem]",
          )}
        >
          {title}
          {count != null ? (
            <span className="ml-2 align-[0.15em] font-sans text-sm font-medium tracking-normal text-ink-3 tabular-nums">
              {count}
            </span>
          ) : null}
        </Heading>
        {trailing ? (
          <div className="flex shrink-0 items-center gap-2">{trailing}</div>
        ) : null}
      </div>
      {description ? (
        <p className="mt-1.5 max-w-2xl text-sm leading-6 text-ink-2">
          {description}
        </p>
      ) : null}
    </div>
  );
}
