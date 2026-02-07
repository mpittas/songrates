"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { FaTimes } from "react-icons/fa";

interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}

export default function Drawer({
  isOpen,
  onClose,
  title,
  children,
}: DrawerProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
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
      role="dialog"
      aria-modal="true"
    >
      {/* Backdrop */}
      <div
        className={`absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${
          isOpen ? "opacity-100" : "opacity-0"
        }`}
        onClick={onClose}
      />

      {/* Drawer Content */}
      <div className="absolute right-0 top-0 bottom-0 w-[80%] max-w-sm bg-[#0a0a0f] border-l border-white/10 shadow-2xl p-6 flex flex-col">
        <div className="flex justify-between items-center mb-8">
          <span className="font-mono text-sm tracking-wide text-neutral-50">
            {title || "Menu"}
          </span>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-white transition-colors p-2"
            aria-label="Close menu"
          >
            <FaTimes size={20} />
          </button>
        </div>

        {children}
      </div>
    </div>,
    document.body,
  );
}
