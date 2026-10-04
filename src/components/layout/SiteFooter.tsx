"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import SongratesLogo from "@/components/layout/SongratesLogo";
import { useAuth } from "@/context/AuthContext";
import { PRIMARY_NAV } from "@/lib/navigation";
import { PAGE_CONTAINER } from "@/lib/pageLayout";
import { cn } from "@/lib/utils";

const HIDDEN_ON = ["/login", "/complete-profile", "/hero-banners", "/album-playlists"];

function FooterColumn({
  title,
  links,
}: {
  title: string;
  links: { href: string; label: string }[];
}) {
  return (
    <nav aria-label={title}>
      <h2 className="eyebrow text-ink-3">{title}</h2>
      <ul className="mt-4 flex flex-col gap-2.5">
        {links.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              className="text-sm text-ink-2 transition-colors hover:text-ink"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

export default function SiteFooter() {
  const pathname = usePathname();
  const { user } = useAuth();

  if (HIDDEN_ON.some((path) => pathname.startsWith(path))) return null;

  const accountLinks = user
    ? [
        { href: "/profile/rated", label: "Rated albums" },
        { href: "/profile/rated-songs", label: "Rated songs" },
        { href: "/profile/liked-songs", label: "Liked songs" },
        { href: "/settings", label: "Settings" },
      ]
    : [
        { href: "/login?view=signup", label: "Create an account" },
        { href: "/login?view=login", label: "Sign in" },
      ];

  return (
    <footer className="mt-auto border-t border-line">
      <div
        className={cn(
          PAGE_CONTAINER,
          "grid grid-cols-2 gap-x-6 gap-y-10 py-12 sm:py-16 lg:grid-cols-[1.6fr_1fr_1fr]",
        )}
      >
        <div className="col-span-2 max-w-xs lg:col-span-1">
          <Link
            href="/"
            aria-label="Songrates home"
            className="inline-flex rounded-md outline-offset-4"
          >
            <SongratesLogo />
          </Link>
          <p className="mt-4 text-sm leading-6 text-ink-2">
            Rate music track by track, finish albums, and see what everyone
            else is listening to.
          </p>
        </div>

        <FooterColumn
          title="Browse"
          links={[{ href: "/", label: "Home" }, ...PRIMARY_NAV]}
        />
        <FooterColumn title="Your music" links={accountLinks} />
      </div>

      <div className="border-t border-line">
        <div
          className={cn(
            PAGE_CONTAINER,
            "flex flex-col gap-2 py-6 text-xs text-ink-3 sm:flex-row sm:items-center sm:justify-between",
          )}
        >
          <p>© {new Date().getFullYear()} songrates</p>
          <p>Catalog data from Apple Music. Playback via YouTube.</p>
        </div>
      </div>
    </footer>
  );
}
