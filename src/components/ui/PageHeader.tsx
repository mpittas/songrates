import type { ReactNode } from "react";
import { LuChevronLeft } from "react-icons/lu";

import InstantLink from "@/components/ui/InstantLink";
import { PAGE_CONTAINER } from "@/lib/pageLayout";
import { cn } from "@/lib/utils";

export interface PageHeaderProps {
  title: ReactNode;
  eyebrow?: ReactNode;
  description?: ReactNode;
  /** Right side on desktop, below the text on mobile. */
  actions?: ReactNode;
  /** Optional back link rendered above the title. */
  back?: { href: string; label: string };
  /** Content under the header row (filters, tabs, chips). */
  children?: ReactNode;
  /** Less space below, for pages that continue straight into filters. */
  tight?: boolean;
  className?: string;
}

/** Title block for top-level browse pages (Explore, Moods, Genres…). */
export default function PageHeader({
  title,
  eyebrow,
  description,
  actions,
  back,
  children,
  tight = false,
  className,
}: PageHeaderProps) {
  return (
    <header
      className={cn(
        PAGE_CONTAINER,
        "pt-8 sm:pt-14",
        tight ? "pb-4 sm:pb-6" : "pb-8 sm:pb-10",
        className,
      )}
    >
      {back ? (
        <InstantLink
          href={back.href}
          className="-ml-1 mb-4 inline-flex items-center gap-1 rounded-full py-1 pr-2.5 pl-1 text-sm font-medium text-ink-2 transition-colors hover:bg-ink/[0.05] hover:text-ink"
        >
          <LuChevronLeft size={16} aria-hidden />
          {back.label}
        </InstantLink>
      ) : null}

      <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          {eyebrow ? <p className="eyebrow mb-3 text-ink-3">{eyebrow}</p> : null}
          <h1 className="font-display text-[2.5rem] leading-[1.02] font-semibold tracking-[-0.045em] text-balance text-ink sm:text-[3.5rem]">
            {title}
          </h1>
          {description ? (
            <p className="mt-3 max-w-xl text-[15px] leading-6 text-ink-2 sm:text-base">
              {description}
            </p>
          ) : null}
        </div>
        {actions ? (
          <div className="flex shrink-0 items-center gap-2">{actions}</div>
        ) : null}
      </div>

      {children ? <div className="mt-6 sm:mt-8">{children}</div> : null}
    </header>
  );
}
