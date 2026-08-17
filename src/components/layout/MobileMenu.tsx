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
              "rounded-md px-1 py-3 text-sm font-mono transition-colors",
              isNavLinkActive(pathname, href)
                ? "text-[#00f0ff]"
                : "text-neutral-200 hover:text-[#00f0ff]",
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
              className="rounded-md px-1 py-3 text-sm font-mono text-neutral-200 transition-colors hover:text-[#00f0ff]"
            >
              Log in
            </Link>
            <Button
              href="/login?view=signup"
              onClick={onClose}
              variant="border"
              size="md"
              className="mt-2 w-full rounded-none"
            >
              Sign up
            </Button>
          </>
        )}
      </nav>
    </Drawer>
  );
}
