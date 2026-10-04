"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { IconType } from "react-icons";
import {
  LuCircleUserRound,
  LuCompass,
  LuHouse,
  LuLibrary,
  LuSparkles,
} from "react-icons/lu";

import { useAuth } from "@/context/AuthContext";
import { isNavActive } from "@/lib/navigation";
import { cn } from "@/lib/utils";

/** Routes that are focused flows or design studies, not part of the app shell. */
const HIDDEN_ON = ["/login", "/complete-profile", "/hero-banners", "/album-playlists"];

interface Tab {
  href: string;
  label: string;
  icon: IconType;
  active: boolean;
}

/**
 * Bottom navigation for phones. The mini player floats directly above it
 * (see --mobile-nav-h in globals.css).
 */
export default function MobileTabBar() {
  const pathname = usePathname();
  const { user, loading } = useAuth();
  const hidden = HIDDEN_ON.some((path) => pathname.startsWith(path));

  // Lets the layout drop the tab bar's bottom inset on routes without it.
  useEffect(() => {
    document.documentElement.dataset.tabbar = hidden ? "off" : "on";
  }, [hidden]);

  if (hidden) return null;

  const accountHref = user ? "/profile" : "/login?view=login";
  const tabs: Tab[] = [
    { href: "/", label: "Home", icon: LuHouse, active: pathname === "/" },
    {
      href: "/explore",
      label: "Explore",
      icon: LuCompass,
      active: isNavActive(pathname, "/explore"),
    },
    {
      href: "/moods",
      label: "Moods",
      icon: LuSparkles,
      active: isNavActive(pathname, "/moods"),
    },
    {
      href: "/genres",
      label: "Genres",
      icon: LuLibrary,
      active: isNavActive(pathname, "/genres"),
    },
    {
      href: accountHref,
      label: user || loading ? "Profile" : "Sign in",
      icon: LuCircleUserRound,
      active:
        isNavActive(pathname, "/profile") ||
        isNavActive(pathname, "/settings"),
    },
  ];

  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-[55] border-t border-line bg-canvas/85 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl backdrop-saturate-150 md:hidden"
    >
      <ul className="mx-auto grid h-[60px] max-w-md grid-cols-5">
        {tabs.map(({ href, label, icon: Icon, active }) => (
          <li key={label}>
            <Link
              href={href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex h-full flex-col items-center justify-center gap-1 text-[10.5px] font-medium tracking-tight transition-colors",
                active ? "text-ink" : "text-ink-3 active:text-ink-2",
              )}
            >
              <Icon size={22} strokeWidth={active ? 2.25 : 1.75} aria-hidden />
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
