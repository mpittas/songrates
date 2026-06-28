"use client";

import Link from "next/link";
import Button from "@/components/ui/Button";
import Drawer from "@/components/ui/Drawer";

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function MobileMenu({ isOpen, onClose }: MobileMenuProps) {
  return (
    <Drawer isOpen={isOpen} onClose={onClose} title="Menu">
      <nav className="flex flex-col gap-1">
        <Link
          href="/explore"
          onClick={onClose}
          className="rounded-md px-1 py-3 text-sm font-mono text-neutral-200 transition-colors hover:text-[#00f0ff]"
        >
          Explore
        </Link>
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
      </nav>
    </Drawer>
  );
}
