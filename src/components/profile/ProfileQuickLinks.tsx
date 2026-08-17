"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  PROFILE_NAV_ITEMS,
  isProfileNavActive,
  ownProfilePath,
  userProfilePath,
  type ProfileNavSegment,
} from "@/lib/profileNav";
import { cn } from "@/lib/utils";

interface ProfileQuickLinksProps {
  mode: "own" | "user";
  username?: string;
  counts?: Partial<Record<ProfileNavSegment, number>>;
}

export default function ProfileQuickLinks({
  mode,
  username,
  counts,
}: ProfileQuickLinksProps) {
  const pathname = usePathname();

  const hrefFor = (segment: ProfileNavSegment) =>
    mode === "own"
      ? ownProfilePath(segment)
      : userProfilePath(username!, segment);

  return (
    <nav
      aria-label="Profile collections"
      className="-mx-4 flex gap-1 overflow-x-auto px-4 sm:-mx-6 sm:px-6 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
    >
      {PROFILE_NAV_ITEMS.map((item) => {
        const href = hrefFor(item.segment);
        const active = isProfileNavActive(pathname, href);
        const count = counts?.[item.segment];

        return (
          <Link
            key={item.segment}
            href={href}
            className={cn(
              "relative flex shrink-0 items-center gap-1.5 px-3 py-3 text-sm font-medium whitespace-nowrap transition-colors",
              active
                ? "text-neutral-900"
                : "text-neutral-500 hover:text-neutral-800",
            )}
            aria-current={active ? "page" : undefined}
          >
            {item.label}
            {count != null && count > 0 ? (
              <span
                className={cn(
                  "inline-flex min-w-5 items-center justify-center rounded-full px-1.5 text-[11px] font-semibold tabular-nums",
                  active
                    ? "bg-neutral-900 text-white"
                    : "bg-neutral-200 text-neutral-600",
                )}
              >
                {count}
              </span>
            ) : null}
            {active ? (
              <span className="absolute inset-x-2 bottom-0 h-0.5 rounded-full bg-neutral-900" />
            ) : null}
          </Link>
        );
      })}
    </nav>
  );
}
