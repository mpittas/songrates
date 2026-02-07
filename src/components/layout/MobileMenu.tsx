"use client";

import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import Button from "@/components/ui/Button";
import Drawer from "@/components/ui/Drawer";

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function MobileMenu({ isOpen, onClose }: MobileMenuProps) {
  const { user, signOut } = useAuth();

  // Note: internal state for mounting/portals is now handled by Drawer

  return (
    <Drawer isOpen={isOpen} onClose={onClose} title="Menu">
      <nav className="flex flex-col gap-6">
        <Link
          href="#"
          onClick={onClose}
          className="text-base font-light text-neutral-100 hover:text-neutral-300 transition-colors uppercase tracking-widest"
        >
          Charts
        </Link>
        <div className="h-px w-full bg-white/10 my-2" />
        {!user && (
          <>
            <Link
              href="/login?view=login"
              onClick={onClose}
              className="text-sm font-mono text-neutral-100 hover:text-[#00f0ff] transition-colors uppercase tracking-widest"
            >
              Login
            </Link>
            <Button
              href="/login?view=signup"
              onClick={onClose}
              variant="border"
              size="md"
              className="w-full rounded-none"
            >
              Sign up
            </Button>
          </>
        )}
      </nav>
    </Drawer>
  );
}
