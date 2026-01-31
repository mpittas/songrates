"use client";

import Link from "next/link";
import MySection from "@/components/MySection";
import HeaderSearchBar from "@/components/HeaderSearchBar";
import { usePathname } from "next/navigation";

export default function Header() {
  const pathname = usePathname();
  const isHomepage = pathname === "/";

  return (
    <header
      className={`
        border-b backdrop-blur-sm sticky top-0 z-50 mx-auto w-full transition-all duration-300
        ${
          isHomepage
            ? "border-white/5 bg-[#050507]/40"
            : "border-white/10 bg-[#050507]/90 backdrop-blur-md"
        }
      `}
    >
      <MySection className="py-0">
        <div
          className={`
            flex items-center justify-between gap-4 transition-all duration-300
            ${isHomepage ? "h-16" : "h-12"}
          `}
        >
          <Link
            href="/"
            className="font-mono text-sm tracking-wide text-neutral-50 transition-colors hover:text-[#00f0ff] flex-shrink-0"
          >
            songrates_
          </Link>

          {/* Show search bar on non-homepage pages */}
          {!isHomepage && (
            <div className="flex-1 flex justify-center max-w-2xl mx-auto">
              <HeaderSearchBar />
            </div>
          )}

          <nav className="flex items-center gap-8 flex-shrink-0">
            <Link
              href="#"
              className="font-mono text-xs text-neutral-100 transition-colors hover:text-neutral-300"
            >
              charts
            </Link>
            <Link
              href="#"
              className="font-mono text-xs text-neutral-100 transition-colors hover:text-neutral-300"
            >
              lists
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
