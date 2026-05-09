"use client";

import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import Button from "@/components/ui/Button";
import Drawer from "@/components/ui/Drawer";
import { FaStar } from "react-icons/fa";

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function MobileMenu({ isOpen, onClose }: MobileMenuProps) {
  const { user } = useAuth();

  return (
    <Drawer isOpen={isOpen} onClose={onClose} title="Menu">
      <nav className="flex flex-col gap-1">
        <Link
          href="/rated"
          onClick={onClose}
          className="flex items-center gap-3 rounded-md px-1 py-3 text-base font-medium text-neutral-100 transition-colors hover:bg-white/5 hover:text-white"
        >
          <FaStar size={16} className="text-neutral-400" aria-hidden />
          Rated
        </Link>

        {!user && (
          <>
            <div className="my-3 h-px w-full bg-white/10" />
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
