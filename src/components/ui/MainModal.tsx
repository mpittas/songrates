"use client";

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
    <div className="p-5 flex flex-col gap-4 bg-white border-b border-neutral-200">
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <h2 className="text-xl font-bold tracking-tight text-neutral-900 leading-tight">
            {title}
          </h2>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="w-8 h-8 flex items-center justify-center rounded-full bg-neutral-50 text-neutral-400 hover:text-neutral-900 hover:bg-neutral-100 transition-all border border-neutral-100"
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
  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-neutral-950/40 backdrop-blur-md" />

      <div
        className={`relative w-full ${maxWidthClassName} max-h-[85vh] bg-white border border-neutral-200 shadow-2xl flex flex-col rounded-3xl overflow-hidden scale-in-center animate-in zoom-in-95 duration-300`}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}

