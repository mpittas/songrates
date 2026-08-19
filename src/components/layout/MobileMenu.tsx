"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Button from "@/components/ui/Button";
import Drawer from "@/components/ui/Drawer";
import { cn } from "@/lib/utils";

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
  showAuthLinks?: boolean;
}

const NAV_LINKS = [
  { href: "/explore", label: "Explore" },
  { href: "/moods", label: "Moods" },
  { href: "/genres", label: "Genres" },
] as const;

function isNavLinkActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function MobileMenu({
  isOpen,
  onClose,
  showAuthLinks = false,
}: MobileMenuProps) {
  const pathname = usePathname();

  return (
    <Drawer isOpen={isOpen} onClose={onClose} title="Menu">
      <nav className="flex flex-col gap-1">
        {NAV_LINKS.map(({ href, label }) => (
          <Link
            key={href}
            href={href}
            onClick={onClose}
            className={cn(
              "rounded-lg px-3 py-3 text-sm font-medium transition-colors",
              isNavLinkActive(pathname, href)
                ? "bg-neutral-100 text-neutral-900"
                : "text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900",
            )}
          >
            {label}
          </Link>
        ))}
        {showAuthLinks && (
          <>
            <Link
              href="/login?view=login"
              onClick={onClose}
              className="rounded-lg px-3 py-3 text-sm font-medium text-neutral-600 transition-colors hover:bg-neutral-50 hover:text-neutral-900"
            >
              Sign in
            </Link>
            <Button
              href="/login?view=signup"
              onClick={onClose}
              variant="primary"
              size="md"
              className="mt-3 w-full"
            >
              Sign up
            </Button>
          </>
        )}
      </nav>
    </Drawer>
  );
}
