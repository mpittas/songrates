import React from "react";
import Link from "next/link";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "border" | "white" | "whiteMuted";
  size?: "xxs" | "xs" | "sm" | "md" | "lg";
  iconLeft?: React.ReactNode;
  iconRight?: React.ReactNode;
  href?: string;
  className?: string;
  isExternal?: boolean;
}

export default function Button({
  children,
  variant = "border",
  size = "md",
  iconLeft,
  iconRight,
  href,
  className = "",
  isExternal = false,
  ...props
}: ButtonProps) {
  const baseStyles =
    "inline-flex items-center justify-center font-mono font-semibold transition-all duration-200 active:scale-95 rounded-full";

  const variants = {
    primary:
      "bg-[#1f1f1f] text-white border border-[#1f1f1f] hover:bg-black hover:border-black",
    secondary:
      "bg-neutral-950/15 hover:bg-neutral-950/25 text-black border-transparent text-xs",
    
    ghost:
      "bg-transparent text-neutral-500 hover:text-neutral-900 hover:bg-neutral-200",
    white:
      "bg-[#fff] text-neutral-900 hover:bg-[#e8e8e8]",
    whiteMuted:
      "bg-[#fff]/20 text-neutral-50 hover:bg-white/30",
    border:
      "bg-white border border-[#d5d5d5] text-neutral-800 hover:bg-[#f8f8f8] hover:text-black hover:border-[#c6c6c6]",
  };

  const sizes = {
    xxs: "px-1 py-0.5 text-[10px]",
    xs: "px-2 py-1 text-xs",
    sm: "px-3 py-1.5 text-sm",
    md: "px-6 py-3 text-base",
    lg: "px-6 py-3 text-lg",
  };

  const combinedClasses = `${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`;

  const content = (
    <>
      {iconLeft && <span className="flex items-center">{iconLeft}</span>}
      {children}
      {iconRight && <span className="flex items-center">{iconRight}</span>}
    </>
  );

  if (href) {
    if (isExternal) {
      return (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className={combinedClasses}
        >
          {content}
        </a>
      );
    }
    return (
      <Link href={href} className={combinedClasses}>
        {content}
      </Link>
    );
  }

  return (
    <button className={combinedClasses} {...props}>
      {content}
    </button>
  );
}
