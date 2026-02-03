"use client";

import Link from "next/link";
import MySection from "@/components/MySection";
import HeaderSearchBar from "@/components/HeaderSearchBar";
import { usePathname } from "next/navigation";

interface HeaderProps {
  showSearch?: boolean;
}

export default function Header({ showSearch }: HeaderProps) {
  const pathname = usePathname();
  const isHomepage = pathname === "/";

  // Use the prop if provided, otherwise default to hiding on homepage
  const shouldShowSearch = showSearch ?? !isHomepage;

  return (
    <header className="border-b border-white/10 bg-[#050507]/90 backdrop-blur-md sticky top-0 z-50 mx-auto w-full transition-all duration-300">
      <MySection className="py-0">
        <div className="flex items-center justify-between gap-4 h-16 transition-all duration-300">
          <Link
            href="/"
            className="font-mono text-sm tracking-wide text-neutral-50 transition-colors hover:text-[#00f0ff] flex-shrink-0"
          >
            songrates_
          </Link>

          {/* Optional search bar */}
          {shouldShowSearch && (
            <div className="flex-1 flex justify-center max-w-2xl mx-auto">
              <HeaderSearchBar />
            </div>
          )}

          <nav className="flex items-center gap-8 flex-shrink-0">
            <Link
              href="/rated"
              className="font-mono text-xs text-neutral-100 transition-colors hover:text-[#00f0ff]"
            >
              rated
            </Link>
            <Link
              href="#"
              className="font-mono text-xs text-neutral-100 transition-colors hover:text-neutral-300"
            >
              charts
            </Link>
            <span className="h-3 w-px bg-neutral-100"></span>
            <Link
              href="#"
              className="font-mono text-xs text-neutral-100 transition-colors hover:text-neutral-300"
            >
              profile
            </Link>
          </nav>
        </div>
      </MySection>
    </header>
  );
}
