import type { ReactNode } from "react";

import ProfileCover from "@/components/profile/ProfileCover";
import { PAGE_CONTAINER } from "@/lib/pageLayout";
import { cn } from "@/lib/utils";

interface IdentityPageLayoutProps {
  media: ReactNode;
  title: ReactNode;
  subtitle?: ReactNode;
  actions?: ReactNode;
  nav?: ReactNode;
  children: ReactNode;
}

export default function IdentityPageLayout({
  media,
  title,
  subtitle,
  actions,
  nav,
  children,
}: IdentityPageLayoutProps) {
  return (
    <main className="min-h-screen bg-[var(--background)] pb-24">
      <div className="relative">
        <div className="relative h-44 overflow-hidden sm:h-56 md:h-64">
          <ProfileCover />
          <div className="absolute inset-0 bg-gradient-to-t from-[var(--background)] from-0% via-[var(--background)]/40 via-45% to-transparent" />
        </div>

        <div className={cn(PAGE_CONTAINER, "relative z-10")}>
          <div className="flex flex-col gap-5 pb-5 sm:flex-row sm:items-end sm:justify-between sm:gap-8">
            <div className="-mt-12 flex min-w-0 items-end gap-4 sm:-mt-14 sm:gap-5">
              {media}
              <div className="min-w-0 pb-0.5 sm:pb-1">
                <h1 className="truncate text-3xl font-semibold tracking-tight text-neutral-900 sm:text-4xl">
                  {title}
                </h1>
                {subtitle ? (
                  <div className="mt-1 text-sm text-neutral-500">{subtitle}</div>
                ) : null}
              </div>
            </div>

            {actions ? (
              <div className="flex shrink-0 flex-wrap items-center gap-2 sm:pb-1">
                {actions}
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {nav ? (
        <div className="sticky top-0 z-20 border-b border-neutral-200/80 bg-[var(--background)]/90 backdrop-blur-md">
          <div className={PAGE_CONTAINER}>{nav}</div>
        </div>
      ) : null}

      <div className={cn(PAGE_CONTAINER, nav ? "pt-8" : "pt-6")}>{children}</div>
    </main>
  );
}
