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
        </div>

        <div className={cn(PAGE_CONTAINER, "relative z-10")}>
          <div className="flex flex-col gap-4 pb-5 sm:flex-row sm:items-start sm:justify-between sm:gap-8">
            <div className="flex min-w-0 items-start gap-4 sm:gap-5">
              <div className="-mt-12 shrink-0 sm:-mt-14">{media}</div>
              <div className="min-w-0 pt-4 sm:pt-5">
                <h1 className="truncate text-3xl font-semibold tracking-tight text-neutral-900 sm:text-4xl">
                  {title}
                </h1>
                {subtitle ? (
                  <div className="mt-1 text-sm text-neutral-500">{subtitle}</div>
                ) : null}
              </div>
            </div>

            {actions ? (
              <div className="flex shrink-0 flex-wrap items-center gap-2 pt-1 sm:pt-5">
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
