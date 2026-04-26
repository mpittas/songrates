"use client";

import { useState } from "react";
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

interface HeaderProps {
  showSearch?: boolean;
}

export default function Header({ showSearch }: HeaderProps) {
  const { user, signOut, loading } = useAuth();
  const pathname = usePathname();

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);

  // Use explicit prop if provided; otherwise hide search on homepage
  const shouldShowSearch = showSearch ?? pathname !== "/";

  return (
    <>
      <header className="border-b border-neutral-200 bg-white/95 backdrop-blur-md sticky top-0 z-50 mx-auto w-full transition-all duration-300">
        <MySection className="py-0">
          <div className="flex items-center justify-between gap-4 h-16 transition-all duration-300">
            <Link
              href="/"
              className="text-[21px] font-semibold tracking-tight text-[#1b1b1b] transition-colors hover:text-black flex-shrink-0"
            >
              I Songrates.
            </Link>

            {/* Optional search bar - hide on very small screens if needed, or adjust */}
            {shouldShowSearch && (
              <>
                {/* Desktop Search Bar */}
                <div className="hidden md:flex flex-1 justify-center max-w-xl mx-auto px-2 md:px-0 min-w-0">
                  <HeaderSearchBar />
                </div>

                {/* Mobile Search Icon */}
                <button
                  className="md:hidden text-neutral-700 p-2 ml-auto"
                  onClick={() => setIsMobileSearchOpen(true)}
                  aria-label="Open search"
                >
                  <IoSearch size={20} />
                </button>

                {/* Mobile Search Overlay */}
                {isMobileSearchOpen && (
                  <div className="fixed inset-0 z-[100] bg-[#ebe8e5] p-4 flex flex-col animate-in fade-in duration-200">
                    <div className="flex items-center gap-4">
                      <div className="flex-1">
                        <HeaderSearchBar />
                      </div>
                      <button
                        onClick={() => setIsMobileSearchOpen(false)}
                        className="text-sm text-neutral-600 hover:text-neutral-900 transition-colors"
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
                className="text-sm text-neutral-700 transition-colors hover:text-neutral-900"
              >
                Charts
              </Link>
              <Link
                href="#"
                className="text-sm text-neutral-700 transition-colors hover:text-neutral-900"
              >
                Explore
              </Link>
              <span className="h-8 w-8 rounded-full bg-neutral-300/90"></span>

              {!loading && (
                <>
                  {user ? (
                    <UserMenu user={user} onSignOut={signOut} />
                  ) : (
                    <>
                      <Link
                        href="/login?view=login"
                        className="text-sm text-neutral-700 transition-colors hover:text-neutral-950"
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
              {!loading && user && (
                <UserMenu user={user} onSignOut={signOut} isMobile={true} />
              )}
              {/* Mobile Menu Button */}
              <button
                className="text-neutral-700 p-2"
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
