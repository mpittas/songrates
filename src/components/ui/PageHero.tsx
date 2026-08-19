import { ReactNode } from "react";

import { PAGE_CONTAINER_WIDTH } from "@/lib/pageLayout";
import { cn } from "@/lib/utils";

interface PageHeroProps {
  title: string;
  /** Supporting line under the title. */
  subtitle?: ReactNode;
  /** Leading icon node, rendered in a frosted tile. */
  icon?: ReactNode;
  /** Trailing actions (e.g. play button). */
  actions?: ReactNode;
  className?: string;
}

/**
 * Shared page hero banner. Renders at the page container width
 * so it aligns with page content below.
 */
export default function PageHero({
  title,
  subtitle,
  icon,
  actions,
  className,
}: PageHeroProps) {
  return (
    <section className="px-2 pt-2">
      <div className={PAGE_CONTAINER_WIDTH}>
        <div className="relative overflow-hidden rounded-2xl">
          {/* Base gradient */}
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,#3a2722_0%,#231a18_45%,#15110f_100%)]" />
          {/* Warm accent */}
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_85%_10%,rgba(237,78,57,0.18)_0%,transparent_50%)]" />
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.06)_0%,transparent_40%)]" />

          <div
            className={cn(
              "relative z-10 flex flex-col gap-6 px-6 py-10 sm:flex-row sm:items-center sm:justify-between sm:px-10 sm:py-12",
              className,
            )}
          >
            <div className="flex min-w-0 items-center gap-5">
              {icon ? (
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-white/15 text-white/90 backdrop-blur-md sm:h-20 sm:w-20">
                  {icon}
                </div>
              ) : null}

              <div className="min-w-0">
                <h1 className="break-words text-3xl font-medium tracking-tight text-white sm:text-4xl">
                  {title}
                </h1>
                {subtitle ? (
                  <div className="mt-2 text-sm text-white/60">{subtitle}</div>
                ) : null}
              </div>
            </div>

            {actions ? (
              <div className="flex shrink-0 items-center gap-3">{actions}</div>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}
