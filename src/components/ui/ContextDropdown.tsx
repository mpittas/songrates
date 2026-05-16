"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { cn } from "@/lib/utils";

const CloseDropdownContext = createContext<(() => void) | null>(null);

export function useCloseContextDropdown() {
  return useContext(CloseDropdownContext);
}

export function ContextDropdownMenuItem({
  icon,
  label,
  onClick,
  onMouseEnter,
  children,
  className,
}: {
  icon?: ReactNode;
  label?: string;
  onClick?: () => void;
  onMouseEnter?: () => void;
  children?: ReactNode;
  className?: string;
}) {
  const close = useCloseContextDropdown();

  if (children) {
    return <>{children}</>;
  }

  return (
    <button
      type="button"
      onMouseEnter={onMouseEnter}
      onClick={(e) => {
        e.stopPropagation();
        onClick?.();
        close?.();
      }}
      className={cn(
        "w-full text-left flex items-center gap-3 px-3 py-2 text-sm font-mono text-neutral-600 hover:text-neutral-900 hover:bg-[#f5f5f5] transition-colors",
        className,
      )}
    >
      <div className="w-4 flex justify-center">{icon}</div>
      <span>{label}</span>
    </button>
  );
}

export function ContextDropdownDivider() {
  return <div className="border-t border-neutral-100 my-1" />;
}

type ContextDropdownPlacement = "below" | "above";
type ContextDropdownAlign = "left" | "right";

interface ContextDropdownProps {
  trigger: ReactNode | ((ctx: { open: boolean; toggle: () => void }) => ReactNode);
  children: ReactNode;
  align?: ContextDropdownAlign;
  placement?: ContextDropdownPlacement;
  panelClassName?: string;
  className?: string;
  onOpenChange?: (open: boolean) => void;
}

const placementClasses: Record<ContextDropdownPlacement, string> = {
  below: "top-full mt-1",
  above: "bottom-full mb-1",
};

const alignClasses: Record<ContextDropdownAlign, string> = {
  left: "left-0",
  right: "right-0",
};

export default function ContextDropdown({
  trigger,
  children,
  align = "right",
  placement = "below",
  panelClassName,
  className,
  onOpenChange,
}: ContextDropdownProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const close = useCallback(() => {
    setOpen(false);
  }, []);

  const toggle = useCallback(() => {
    setOpen((prev) => !prev);
  }, []);

  useEffect(() => {
    onOpenChange?.(open);
  }, [open, onOpenChange]);

  useEffect(() => {
    if (!open) return;

    function handleClickOutside(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  const triggerNode =
    typeof trigger === "function" ? trigger({ open, toggle }) : trigger;

  return (
    <CloseDropdownContext.Provider value={close}>
      <div className={cn("relative", className)} ref={rootRef}>
        {triggerNode}

        {open && (
          <div
            className={cn(
              "absolute bg-white border border-neutral-200 rounded-lg shadow-xl py-1 z-50 w-48",
              placementClasses[placement],
              alignClasses[align],
              panelClassName,
            )}
            onClick={(e) => e.stopPropagation()}
          >
            {children}
          </div>
        )}
      </div>
    </CloseDropdownContext.Provider>
  );
}
