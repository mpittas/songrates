"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LuSearch } from "react-icons/lu";

import SongratesLogo from "@/components/layout/SongratesLogo";
import HeaderSearchBar from "@/components/search/HeaderSearchBar";
import Button from "@/components/ui/Button";
import UserMenu from "@/components/layout/UserMenu";
import { useAuth } from "@/context/AuthContext";
import { PRIMARY_NAV, isNavActive } from "@/lib/navigation";
import { PAGE_CONTAINER } from "@/lib/pageLayout";
import { cn } from "@/lib/utils";

interface HeaderProps {
  showSearch?: boolean;
}

export default function Header({ showSearch }: HeaderProps) {
  const { user, signOut, loading } = useAuth();
  const pathname = usePathname();
  const [searchRoute, setSearchRoute] = useState<string | null>(null);
  const isMobileSearchOpen = searchRoute === pathname;
  const setIsMobileSearchOpen = (open: boolean) => setSearchRoute(open ? pathname : null);
  if (searchRoute !== null && searchRoute !== pathname) setSearchRoute(null);

  const shouldShowSearch =
    showSearch ??
    (pathname !== "/" &&
      !pathname.startsWith("/login") &&
      !pathname.startsWith("/complete-profile") &&
      pathname !== "/hero-banners" &&
      !pathname.startsWith("/album-playlists"));
  const isAuthPage = pathname.startsWith("/login");

  useEffect(() => {
    if (!isMobileSearchOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setSearchRoute(null);
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isMobileSearchOpen]);

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b border-line bg-canvas/80 backdrop-blur-xl backdrop-saturate-150">
        <div
          className={cn(
            PAGE_CONTAINER,
            "flex h-(--header-h) items-center gap-3 md:gap-6",
          )}
        >
          <Link
            href="/"
            aria-label="Songrates home"
            className="flex shrink-0 items-center rounded-md outline-offset-4 transition-opacity hover:opacity-75"
          >
            <SongratesLogo />
          </Link>

          <nav
            aria-label="Primary"
            className="hidden items-center gap-0.5 md:flex"
          >
            {PRIMARY_NAV.map(({ href, label }) => {
              const active = isNavActive(pathname, href);
              return (
                <Link
                  key={href}
                  href={href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "rounded-full px-3 py-1.5 text-sm font-medium tracking-[-0.01em] transition-colors",
                    active
                      ? "bg-ink/[0.07] text-ink"
                      : "text-ink-2 hover:bg-ink/[0.05] hover:text-ink",
                  )}
                >
                  {label}
                </Link>
              );
            })}
          </nav>

          <div className="ml-auto flex min-w-0 items-center gap-2 md:gap-3">
            {shouldShowSearch ? (
              <>
                <div className="hidden w-64 md:block lg:w-80">
                  <HeaderSearchBar />
                </div>
                <Button
                  icon
                  variant="ghost"
                  size="md"
                  className="md:hidden"
                  onClick={() => setIsMobileSearchOpen(true)}
                  aria-label="Search"
                >
                  <LuSearch size={20} />
                </Button>
              </>
            ) : null}

            {!loading &&
              (user ? (
                <UserMenu user={user} onSignOut={signOut} />
              ) : isAuthPage ? null : (
                <Button href="/login?view=login" variant="primary" size="sm">
                  Sign in
                </Button>
              ))}
          </div>
        </div>
      </header>

      {isMobileSearchOpen ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Search music"
          className="animate-fade-in-up fixed inset-0 z-100 flex flex-col bg-canvas px-4 pt-[max(env(safe-area-inset-top),12px)] md:hidden"
        >
          <div className="flex h-14 items-center gap-2">
            <div className="min-w-0 flex-1">
              <HeaderSearchBar autoFocus />
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMobileSearchOpen(false)}
            >
              Cancel
            </Button>
          </div>
        </div>
      ) : null}
    </>
  );
}
