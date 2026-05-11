"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
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

export default function Header({ showSearch }: HeaderProps) {
  const { user, signOut, loading } = useAuth();
  const pathname = usePathname();

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);

  const shouldShowSearch = showSearch ?? pathname !== "/";
  const isRatedActive = pathname === "/rated" || pathname.startsWith("/rated/");

  return (
    <>
      <header className="relative z-50 w-full bg-[#f7f5f2]/92 backdrop-blur-md py-2">
        <MySection className="py-0">
          <div className="flex h-[3.25rem] items-center justify-between gap-3 transition-all duration-300 md:gap-4">
            <Link
              href="/"
              className="relative flex flex-shrink-0 items-center outline-offset-4 transition-opacity hover:opacity-85"
            >
              <Image
                src="/songrates-lettering-logo.svg"
                alt="Songrates"
                width={121}
                height={33}
                className="h-[26px] w-auto md:h-[34px] relative top-1 opacity-80"
                priority
              />
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
              <Link
                href="/rated"
                className={cn(
                  "rounded-md px-3 py-1.5 text-[13px] font-medium tracking-wide transition-colors",
                  isRatedActive
                    ? "bg-neutral-900/5 text-neutral-900"
                    : "text-neutral-600 hover:bg-neutral-200/50 hover:text-neutral-900",
                )}
              >
                Rated
              </Link>

              {!loading && (
                <div className="ml-3 flex items-center gap-3 border-l border-[var(--border)] pl-5">
                  {user ? (
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
                  )}
                </div>
              )}
            </nav>

            <div className="flex items-center gap-1 md:hidden">
              {!loading && user && (
                <UserMenu user={user} onSignOut={signOut} isMobile={true} />
              )}
              <button
                type="button"
                className="rounded-md p-2 text-neutral-600 transition-colors hover:bg-neutral-200/60 hover:text-neutral-900"
                onClick={() => setIsMobileMenuOpen(true)}
                aria-label="Open menu"
              >
                <FaBars size={20} />
              </button>
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
