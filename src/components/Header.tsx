"use client";

import { useState } from "react";
import Link from "next/link";
import MySection from "@/components/MySection";
import HeaderSearchBar from "@/components/HeaderSearchBar";
import { usePathname } from "next/navigation";
import { FaBars } from "react-icons/fa";
import { IoSearch } from "react-icons/io5";
import MobileMenu from "@/components/MobileMenu";
import Button from "@/components/ui/Button";
import UserMenu from "@/components/UserMenu";

interface HeaderProps {
  showSearch?: boolean;
}

import { useAuth } from "@/context/AuthContext";

export default function Header({ showSearch }: HeaderProps) {
  const pathname = usePathname();
  const { user, signOut, loading } = useAuth();
  const isHomepage = pathname === "/";

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);

  // Use the prop if provided, otherwise default to hiding on homepage
  const shouldShowSearch = showSearch ?? !isHomepage;

  return (
    <>
      <header className="border-b border-white/5 bg-[#050507]/40 backdrop-blur-md sticky top-0 z-50 mx-auto w-full transition-all duration-300">
        <MySection className="py-0">
          <div className="flex items-center justify-between gap-4 h-16 transition-all duration-300">
            <Link
              href="/"
              className="font-mono text-sm tracking-wide text-neutral-50 transition-colors hover:text-[#00f0ff] flex-shrink-0"
            >
              Songrates
            </Link>

            {/* Optional search bar - hide on very small screens if needed, or adjust */}
            {shouldShowSearch && (
              <>
                {/* Desktop Search Bar */}
                <div className="hidden md:flex flex-1 justify-center max-w-2xl mx-auto px-2 md:px-0 min-w-0">
                  <HeaderSearchBar />
                </div>

                {/* Mobile Search Icon */}
                <button
                  className="md:hidden text-neutral-100 p-2 ml-auto"
                  onClick={() => setIsMobileSearchOpen(true)}
                  aria-label="Open search"
                >
                  <IoSearch size={20} />
                </button>

                {/* Mobile Search Overlay */}
                {isMobileSearchOpen && (
                  <div className="fixed inset-0 z-[100] bg-[#050507] p-4 flex flex-col animate-in fade-in duration-200">
                    <div className="flex items-center gap-4">
                      <div className="flex-1">
                        <HeaderSearchBar />
                      </div>
                      <button
                        onClick={() => setIsMobileSearchOpen(false)}
                        className="text-sm font-mono text-neutral-400 hover:text-white transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center gap-6 flex-shrink-0">
              <Link
                href="#"
                className="font-mono text-xs text-neutral-100 transition-colors hover:text-neutral-300"
              >
                Charts
              </Link>
              <span className="h-3 w-px bg-neutral-100/20"></span>

              {!loading && (
                <>
                  {user ? (
                    <UserMenu user={user} onSignOut={signOut} />
                  ) : (
                    <>
                      <Link
                        href="/login?view=login"
                        className="font-mono text-xs text-neutral-100 transition-colors hover:text-[#00f0ff]"
                      >
                        Login
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
                </>
              )}
            </nav>

            <div className="flex items-center gap-4 md:hidden">
              {!loading && user && <UserMenu user={user} onSignOut={signOut} />}
              {/* Mobile Menu Button */}
              <button
                className="text-neutral-100 p-2"
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
