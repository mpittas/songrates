import React from "react";
import Link from "next/link";

import { cn } from "@/lib/utils";

export type ButtonVariant =
  "primary" | "secondary" | "ghost" | "border" | "white" | "whiteMuted";

export type ButtonSize = "xxs" | "xs" | "sm" | "md" | "lg";

interface ButtonProps extends Omit<
  React.ButtonHTMLAttributes<HTMLButtonElement>,
  "onClick"
> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  iconLeft?: React.ReactNode;
  iconRight?: React.ReactNode;
  /** Square, icon-only button. Pass an `aria-label`. */
  icon?: boolean;
  href?: string;
  className?: string;
  isExternal?: boolean;
  prefetch?: boolean;
  onClick?: React.MouseEventHandler<HTMLElement>;
}

const ANCHOR_SAFE_PROPS = new Set([
  "id",
  "title",
  "tabIndex",
  "role",
  "onClick",
  "onMouseEnter",
  "onMouseLeave",
  "onFocus",
  "onBlur",
]);

/** Attributes that are valid on both <button> and <a> (aria-*, data-*, …). */
function pickAnchorProps(props: Record<string, unknown>) {
  const picked: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(props)) {
    if (
      key.startsWith("aria-") ||
      key.startsWith("data-") ||
      ANCHOR_SAFE_PROPS.has(key)
    ) {
      picked[key] = value;
    }
  }
  return picked;
}

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary:
    "bg-ink text-white border-ink shadow-[inset_0_1px_0_rgb(255_255_255/0.12)] hover:bg-black hover:border-black",
  secondary: "bg-ink/[0.06] text-ink border-transparent hover:bg-ink/[0.1]",
  ghost:
    "bg-transparent text-ink-2 border-transparent hover:bg-ink/[0.06] hover:text-ink",
  border:
    "bg-surface text-ink border-line-strong shadow-[0_1px_2px_rgb(21_20_19/0.04)] hover:border-ink/25 hover:bg-white",
  white: "bg-white text-ink border-white hover:bg-white/90",
  whiteMuted:
    "bg-white/15 text-white border-white/10 backdrop-blur-md hover:bg-white/25",
};

const SIZE_CLASSES: Record<ButtonSize, string> = {
  xxs: "h-6 gap-1 px-2 text-[11px]",
  xs: "h-7 gap-1.5 px-2.5 text-xs",
  sm: "h-8 gap-1.5 px-3.5 text-[13px]",
  md: "h-10 gap-2 px-5 text-sm",
  lg: "h-12 gap-2 px-6 text-[15px]",
};

const ICON_SIZE_CLASSES: Record<ButtonSize, string> = {
  xxs: "size-6 text-[11px]",
  xs: "size-7 text-xs",
  sm: "size-8 text-[13px]",
  md: "size-10 text-sm",
  lg: "size-12 text-[15px]",
};

export default function Button({
  children,
  variant = "border",
  size = "md",
  iconLeft,
  iconRight,
  icon = false,
  href,
  className = "",
  isExternal = false,
  prefetch,
  ...props
}: ButtonProps) {
  const combinedClasses = cn(
    "inline-flex shrink-0 cursor-pointer select-none items-center justify-center whitespace-nowrap rounded-full border font-semibold tracking-[-0.01em]",
    "transition-[background-color,border-color,color,box-shadow,transform] duration-200 ease-out active:scale-[0.97]",
    "disabled:pointer-events-none disabled:opacity-45",
    VARIANT_CLASSES[variant],
    icon ? cn(ICON_SIZE_CLASSES[size], "p-0") : SIZE_CLASSES[size],
    className,
  );

  const content = (
    <>
      {iconLeft && (
        <span className="flex shrink-0 items-center" aria-hidden>
          {iconLeft}
        </span>
      )}
      {children}
      {iconRight && (
        <span className="flex shrink-0 items-center" aria-hidden>
          {iconRight}
        </span>
      )}
    </>
  );

  if (href) {
    const linkProps = {
      ...pickAnchorProps(props),
      className: combinedClasses,
    } as React.AnchorHTMLAttributes<HTMLAnchorElement>;

    if (isExternal) {
      return (
        <a href={href} target="_blank" rel="noopener noreferrer" {...linkProps}>
          {content}
        </a>
      );
    }
    return (
      <Link href={href} prefetch={prefetch} {...linkProps}>
        {content}
      </Link>
    );
  }

  return (
    <button type="button" className={combinedClasses} {...props}>
      {content}
    </button>
  );
}
