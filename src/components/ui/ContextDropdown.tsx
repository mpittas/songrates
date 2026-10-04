"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";

const CloseDropdownContext = createContext<(() => void) | null>(null);

export function useCloseContextDropdown() {
  return useContext(CloseDropdownContext);
}

/** Shared look for every row inside a context menu. */
export const MENU_ITEM_CLASS =
  "flex w-full cursor-pointer items-center gap-3 rounded-lg px-2.5 py-2 text-left text-sm text-ink-2 transition-colors hover:bg-ink/[0.05] hover:text-ink";

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
      role="menuitem"
      onMouseEnter={onMouseEnter}
      onClick={(e) => {
        e.stopPropagation();
        onClick?.();
        close?.();
      }}
      className={cn(MENU_ITEM_CLASS, className)}
    >
      <span className="flex w-4 shrink-0 justify-center text-ink-3">
        {icon}
      </span>
      <span>{label}</span>
    </button>
  );
}

export function ContextDropdownDivider() {
  return <div className="mx-2.5 my-1 h-px bg-line" />;
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

const GAP = 6;
const VIEWPORT_MARGIN = 8;

/**
 * Menu anchored to its trigger. The panel renders in a portal with fixed
 * positioning so scroll containers and rounded panels never clip it, and it
 * flips above/below when there is not enough room in the viewport.
 */
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
  const [position, setPosition] = useState<{ top: number; left: number } | null>(
    null,
  );
  const rootRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const close = useCallback(() => {
    setOpen(false);
  }, []);

  const toggle = useCallback(() => {
    setOpen((prev) => !prev);
  }, []);

  useEffect(() => {
    onOpenChange?.(open);
  }, [open, onOpenChange]);

  const updatePosition = useCallback(() => {
    const anchor = rootRef.current;
    const panel = panelRef.current;
    if (!anchor || !panel) return;

    const rect = anchor.getBoundingClientRect();
    const { offsetWidth: width, offsetHeight: height } = panel;
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;

    let showAbove = placement === "above";
    if (showAbove && spaceAbove < height + GAP + VIEWPORT_MARGIN) {
      showAbove = spaceBelow < spaceAbove;
    } else if (!showAbove && spaceBelow < height + GAP + VIEWPORT_MARGIN) {
      showAbove = spaceAbove > spaceBelow;
    }

    const top = showAbove ? rect.top - height - GAP : rect.bottom + GAP;
    const preferredLeft = align === "right" ? rect.right - width : rect.left;
    const left = Math.min(
      Math.max(preferredLeft, VIEWPORT_MARGIN),
      window.innerWidth - width - VIEWPORT_MARGIN,
    );

    setPosition({ top, left });
  }, [align, placement]);

  useLayoutEffect(() => {
    if (!open) {
      setPosition(null);
      return;
    }
    updatePosition();
  }, [open, updatePosition]);

  useEffect(() => {
    if (!open) return;

    function handlePointerDown(e: MouseEvent) {
      const target = e.target as Node;
      if (rootRef.current?.contains(target)) return;
      if (panelRef.current?.contains(target)) return;
      setOpen(false);
    }

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    window.addEventListener("scroll", updatePosition, true);
    window.addEventListener("resize", updatePosition);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("scroll", updatePosition, true);
      window.removeEventListener("resize", updatePosition);
    };
  }, [open, updatePosition]);

  const triggerNode =
    typeof trigger === "function" ? trigger({ open, toggle }) : trigger;

  return (
    <CloseDropdownContext.Provider value={close}>
      <div className={cn("relative", className)} ref={rootRef}>
        {triggerNode}

        {open &&
          createPortal(
            <div
              ref={panelRef}
              role="menu"
              className={cn(
                "fixed z-[90] w-52 rounded-xl bg-surface p-1 shadow-pop",
                "transition-[opacity,transform] duration-150 ease-out",
                position ? "translate-y-0 opacity-100" : "translate-y-1 opacity-0",
                panelClassName,
              )}
              style={{
                top: position?.top ?? 0,
                left: position?.left ?? 0,
                visibility: position ? "visible" : "hidden",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {children}
            </div>,
            document.body,
          )}
      </div>
    </CloseDropdownContext.Provider>
  );
}
