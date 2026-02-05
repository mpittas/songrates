"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createPortal } from "react-dom";
import { FaTimes } from "react-icons/fa";
import { useAuth } from "@/context/AuthContext";
import Button from "@/components/ui/Button";

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function MobileMenu({ isOpen, onClose }: MobileMenuProps) {
  const [mounted, setMounted] = useState(false);
  const { user, signOut } = useAuth();

  useEffect(() => {
    setMounted(true);
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!mounted) return null;

  return createPortal(
    <div
      className={`fixed inset-0 z-[100] transform transition-transform duration-300 ease-in-out ${
        isOpen ? "translate-x-0" : "translate-x-full"
      }`}
    >
      {/* Backdrop */}
      <div
        className={`absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${
          isOpen ? "opacity-100" : "opacity-0"
        }`}
        onClick={onClose}
      />

      {/* Menu Content */}
      <div className="absolute right-0 top-0 bottom-0 w-[80%] max-w-sm bg-[#0a0a0f] border-l border-white/10 shadow-2xl p-6 flex flex-col">
        <div className="flex justify-between items-center mb-8">
          <span className="font-mono text-sm tracking-wide text-neutral-50">
            Menu
          </span>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-white transition-colors p-2"
            aria-label="Close menu"
          >
            <FaTimes size={20} />
          </button>
        </div>

        <nav className="flex flex-col gap-6">
          <Link
            href="#"
            onClick={onClose}
            className="text-2xl font-light text-neutral-100 hover:text-neutral-300 transition-colors"
          >
            Charts
          </Link>

          <div className="h-px w-full bg-white/10 my-2" />

          {!user && (
            <>
              <Link
                href="/login?view=login"
                onClick={onClose}
                className="text-xl font-mono text-neutral-100 hover:text-[#00f0ff] transition-colors"
              >
                Login
              </Link>
              <Button
                href="/login?view=signup"
                onClick={onClose}
                variant="border"
                size="md"
                className="w-full"
              >
                Sign up
              </Button>
            </>
          )}
        </nav>
      </div>
    </div>,
    document.body,
  );
}
