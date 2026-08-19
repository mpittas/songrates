"use client";

import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { IoClose } from "react-icons/io5";

import { cn } from "@/lib/utils";

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
  const [rendered, setRendered] = useState(false);
  const titleId = useId();
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const previousOverflow = useRef<string>("");

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) setRendered(true);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    previousOverflow.current = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow.current;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!mounted || (!isOpen && !rendered)) return null;

  return createPortal(
    <div
      className={cn(
        "fixed inset-0 z-100",
        isOpen ? "pointer-events-auto" : "pointer-events-none",
      )}
      aria-hidden={!isOpen}
      {...(!isOpen ? { inert: true } : {})}
    >
      <div
        className={cn(
          "absolute inset-0 bg-neutral-950/40 transition-opacity duration-300",
          isOpen ? "opacity-100" : "opacity-0",
        )}
        onClick={onClose}
      />

      <div
        role={isOpen ? "dialog" : undefined}
        aria-modal={isOpen ? true : undefined}
        aria-labelledby={titleId}
        className={cn(
          "absolute top-0 right-0 bottom-0 flex w-[min(100%,20rem)] flex-col border-l border-neutral-200 bg-white p-6 shadow-[0_8px_32px_rgba(15,15,15,0.12)] transition-transform duration-300 ease-out",
          isOpen ? "translate-x-0" : "translate-x-full",
        )}
      >
        <div className="mb-8 flex items-center justify-between">
          <span
            id={titleId}
            className="text-sm font-medium tracking-tight text-neutral-900"
          >
            {title || "Menu"}
          </span>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            className="flex size-10 cursor-pointer items-center justify-center rounded-md text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-900"
            aria-label="Close menu"
          >
            <IoClose size={22} />
          </button>
        </div>

        {children}
      </div>
    </div>,
    document.body,
  );
}
