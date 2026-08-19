"use client";

import { useEffect } from "react";
import type React from "react";
import { FaTimes } from "react-icons/fa";

interface MainModalProps {
  onClose: () => void;
  children: React.ReactNode;
  maxWidthClassName?: string;
}

export function MainModalHeader({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex shrink-0 flex-col gap-4 border-b border-neutral-200 bg-white p-5">
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <h2 className="text-xl leading-tight font-bold tracking-tight text-neutral-900">
            {title}
          </h2>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border border-neutral-100 bg-neutral-50 text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-900"
          aria-label="Close"
        >
          <FaTimes size={14} />
        </button>
      </div>
      {children}
    </div>
  );
}

export default function MainModal({
  onClose,
  children,
  maxWidthClassName = "max-w-sm",
}: MainModalProps) {
  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-100 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-neutral-950/40" />

      <div
        role="dialog"
        aria-modal="true"
        className={`relative flex max-h-[85vh] w-full flex-col overflow-hidden rounded-3xl border border-neutral-200 bg-white shadow-[0_16px_48px_rgba(15,15,15,0.18)] ${maxWidthClassName}`}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}
