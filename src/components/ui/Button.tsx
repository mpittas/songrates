import React from "react";
import Link from "next/link";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "border";
  size?: "xs" | "sm" | "md" | "lg";
  iconLeft?: React.ReactNode;
  iconRight?: React.ReactNode;
  href?: string;
  className?: string;
  isExternal?: boolean;
}

export default function Button({
  children,
  variant = "border",
  size = "sm",
  iconLeft,
  iconRight,
  href,
  className = "",
  isExternal = false,
  ...props
}: ButtonProps) {
  const baseStyles =
    "inline-flex items-center justify-center font-mono transition-all duration-200 active:scale-95";

  const variants = {
    primary:
      "bg-[#00f0ff] text-[#050507] border border-[#00f0ff] hover:bg-[#00d8e6] hover:border-[#00d8e6]",
    secondary:
      "bg-white text-black border border-white hover:bg-neutral-200 hover:border-neutral-200",
    ghost: "bg-transparent text-neutral-400 hover:text-white hover:bg-white/5",
    border:
      "bg-transparent border border-white/10 text-neutral-300 hover:bg-white hover:text-black hover:border-white",
  };

  const sizes = {
    xs: "px-2 py-1 text-[10px]",
    sm: "px-4 py-2 text-xs",
    md: "px-6 py-3 text-sm",
    lg: "px-8 py-4 text-base",
  };

  const combinedClasses = `${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`;

  const content = (
    <>
      {iconLeft && <span className="mr-2 flex items-center">{iconLeft}</span>}
      {children}
      {iconRight && <span className="ml-2 flex items-center">{iconRight}</span>}
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
