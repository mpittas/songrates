"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import SongratesLogo from "@/components/layout/SongratesLogo";
import MySection from "@/components/ui/MySection";
import HeaderSearchBar from "@/components/search/HeaderSearchBar";
import { FaBars } from "react-icons/fa";
import { IoSearch } from "react-icons/io5";
import MobileMenu from "@/components/layout/MobileMenu";
import Button from "@/components/ui/Button";
import UserMenu from "@/components/layout/UserMenu";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";

interface HeaderProps {
  showSearch?: boolean;
}

const NAV_LINKS = [
  { href: "/explore", label: "Explore" },
  { href: "/moods", label: "Moods" },
  { href: "/playlists", label: "Playlists" },
] as const;

function isNavLinkActive(pathname: string, href: string) {
  if (href === "/playlists") {
    return pathname === "/playlists" || pathname.startsWith("/playlist/");
  }

  return pathname === href;
}

function navLinkClassName(pathname: string, href: string) {
  return cn(
    "rounded-full px-3 py-1.5 text-sm font-medium transition-colors",
    isNavLinkActive(pathname, href)
      ? "bg-neutral-900 text-white"
      : "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900",
  );
}

function mobileNavLinkClassName(pathname: string, href: string) {
  return cn(
    "rounded-full px-3 py-1.5 text-sm font-medium transition-colors",
    isNavLinkActive(pathname, href)
      ? "bg-neutral-900 text-white"
      : "text-neutral-600 hover:bg-neutral-200/60 hover:text-neutral-900",
  );
}

export default function Header({ showSearch }: HeaderProps) {
  const { user, signOut, loading } = useAuth();
  const pathname = usePathname();

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);

  const shouldShowSearch = showSearch ?? pathname !== "/";

  return (
    <>
      <header className="relative z-50 w-full border-b border-neutral-200 bg-white py-2">
        <MySection className="py-0">
          <div className="flex h-[3.25rem] items-center justify-between gap-3 transition-all duration-300 md:gap-4">
            <Link
              href="/"
              aria-label="Songrates home"
              className="relative flex flex-shrink-0 items-center outline-offset-4 transition-opacity hover:opacity-80"
            >
              <SongratesLogo />
            </Link>

            {shouldShowSearch && (
              <>
                <div className="mx-auto hidden min-w-0 max-w-xl flex-1 justify-center px-2 md:flex md:px-0">
                  <HeaderSearchBar />
                </div>

                <button
                  type="button"
                  className="ml-auto rounded-md p-2 text-neutral-600 transition-colors hover:bg-neutral-200/60 hover:text-neutral-900 md:hidden"
                  onClick={() => setIsMobileSearchOpen(true)}
                  aria-label="Open search"
                >
                  <IoSearch size={22} />
                </button>

                {isMobileSearchOpen && (
                  <div className="animate-in fade-in fixed inset-0 z-[100] flex flex-col bg-[var(--background)] p-4 duration-200">
                    <div className="flex items-center gap-3">
                      <div className="min-w-0 flex-1">
                        <HeaderSearchBar />
                      </div>
                      <button
                        type="button"
                        onClick={() => setIsMobileSearchOpen(false)}
                        className="flex-shrink-0 text-sm font-medium text-neutral-600 transition-colors hover:text-neutral-900"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}

            <nav className="hidden flex-shrink-0 items-center gap-1 md:flex">
              <div className="flex items-center gap-3">
                {NAV_LINKS.map(({ href, label }) => (
                  <Link
                    key={href}
                    href={href}
                    className={navLinkClassName(pathname, href)}
                  >
                    {label}
                  </Link>
                ))}
                {!loading &&
                  (user ? (
                    <UserMenu user={user} onSignOut={signOut} />
                  ) : (
                    <>
                      <Link
                        href="/login?view=login"
                        className="text-[13px] font-medium tracking-wide text-neutral-600 transition-colors hover:text-neutral-900"
                      >
                        Log in
                      </Link>
                      <Button
                        href="/login?view=signup"
                        variant="border"
                        size="sm"
                      >
                        Sign up
                      </Button>
                    </>
                  ))}
              </div>
            </nav>

            <div className="flex items-center gap-1 md:hidden">
              {NAV_LINKS.map(({ href, label }) => (
                <Link
                  key={href}
                  href={href}
                  className={mobileNavLinkClassName(pathname, href)}
                >
                  {label}
                </Link>
              ))}
              {!loading && user && (
                <UserMenu user={user} onSignOut={signOut} isMobile={true} />
              )}
              {!loading && !user && (
                <button
                  type="button"
                  className="rounded-md p-2 text-neutral-600 transition-colors hover:bg-neutral-200/60 hover:text-neutral-900"
                  onClick={() => setIsMobileMenuOpen(true)}
                  aria-label="Open menu"
                >
                  <FaBars size={20} />
                </button>
              )}
            </div>
          </div>
        </MySection>
      </header>

      <MobileMenu
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
      />
    </>
  );
}
