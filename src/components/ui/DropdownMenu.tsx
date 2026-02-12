"use client";

import { useState, useRef, useEffect, ReactNode } from "react";
import { createPortal } from "react-dom";

interface DropdownMenuProps {
  trigger: ReactNode;
  children: ReactNode;
  align?: "left" | "right";
  className?: string;
}

export default function DropdownMenu({
  trigger,
  children,
  align = "right",
  className = "",
}: DropdownMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLDivElement>(null);

  const updatePosition = () => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();

      setPosition({
        top: rect.bottom + 4, // 4px gap
        left: align === "right" ? rect.right : rect.left,
      });
    }
  };

  // Logic for unique ID or ref
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Click outside handler logic
  useEffect(() => {
    if (!isOpen) return;

    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (
        triggerRef.current &&
        !triggerRef.current.contains(target) &&
        dropdownRef.current &&
        !dropdownRef.current.contains(target)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [isOpen]);

  // Position update on scroll/resize
  useEffect(() => {
    if (isOpen) {
      updatePosition();
      window.addEventListener("scroll", updatePosition, true);
      window.addEventListener("resize", updatePosition);
    }
    return () => {
      window.removeEventListener("scroll", updatePosition, true);
      window.removeEventListener("resize", updatePosition);
    };
  }, [isOpen]);

  return (
    <>
      <div
        ref={triggerRef}
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        className={`inline-block ${className}`}
      >
        {trigger}
      </div>

      {isOpen &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            ref={dropdownRef}
            className="fixed z-[9999] min-w-[160px] bg-[#0a0a0d] border border-[#1a1a1f] rounded-lg shadow-xl py-1 animate-in fade-in zoom-in-95 duration-100"
            style={{
              top: position.top, // Use state position
              left: align === "right" ? position.left : position.left,
              transform: align === "right" ? "translateX(-100%)" : "none",
            }}
            onClick={(e) => {
              e.stopPropagation();
              if ((e.target as HTMLElement).closest("[data-menu-close]")) {
                setIsOpen(false);
              }
            }}
          >
            {children}
          </div>,
          document.body,
        )}
    </>
  );
}
