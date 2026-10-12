"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { User } from "@supabase/supabase-js";
import { LuLogOut, LuSettings } from "react-icons/lu";
import { cn } from "@/lib/utils";

interface UserMenuProps {
  user: User;
  onSignOut: () => Promise<void>;
  isMobile?: boolean;
}

function getDisplayName(user: User) {
  return (
    user.user_metadata?.full_name ||
    user.user_metadata?.name ||
    user.user_metadata?.username ||
    user.email?.split("@")[0] ||
    "Account"
  );
}

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  return name.slice(0, 1).toUpperCase() || "A";
}

function UserAvatar({
  url,
  name,
  size,
}: {
  url?: string;
  name: string;
  size: number;
}) {
  if (url) {
    return (
      <Image
        src={url}
        alt=""
        width={size}
        height={size}
        className="rounded-full object-cover"
      />
    );
  }

  return (
    <span
      aria-hidden
      className="flex items-center justify-center rounded-full bg-ink font-semibold text-white"
      style={{ width: size, height: size, fontSize: size * 0.38 }}
    >
      {getInitials(name)}
    </span>
  );
}

function MenuRow({
  icon,
  children,
  href,
  onClick,
}: {
  icon: ReactNode;
  children: ReactNode;
  href?: string;
  onClick?: () => void;
}) {
  const className = cn(
    "flex w-full cursor-pointer items-center gap-3 rounded-xl px-2.5 py-2 text-left text-sm text-ink-2",
    "transition-colors duration-150",
    "hover:bg-ink/[0.05] hover:text-ink",
    "focus-visible:bg-ink/[0.05] focus-visible:outline-none",
  );

  const content = (
    <>
      <span className="flex size-4 shrink-0 items-center justify-center text-ink-3">
        {icon}
      </span>
      <span className="min-w-0 truncate">{children}</span>
    </>
  );

  if (href) {
    return (
      <Link
        href={href}
        role="menuitem"
        className={className}
        onClick={onClick}
      >
        {content}
      </Link>
    );
  }

  return (
    <button type="button" role="menuitem" className={className} onClick={onClick}>
      {content}
    </button>
  );
}

export default function UserMenu({ user, onSignOut }: UserMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const menuId = useId();

  const displayName = getDisplayName(user);
  const email = user.email ?? "";
  const username = user.user_metadata?.username as string | undefined;
  const avatarUrl = user.user_metadata?.avatar_url as string | undefined;
  const secondary = username ? `@${username}` : email;
  const showSecondary = Boolean(secondary && secondary !== displayName);

  useEffect(() => {
    if (!isOpen) return;

    function handlePointerDown(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const close = () => setIsOpen(false);

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        aria-label="Account menu"
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-controls={menuId}
        className={cn(
          "flex size-9 cursor-pointer items-center justify-center overflow-hidden rounded-full",
          "ring-2 ring-offset-2 ring-offset-canvas transition-[box-shadow,transform] duration-150",
          "focus-visible:outline-none focus-visible:ring-ink",
          isOpen ? "ring-ink" : "ring-transparent hover:ring-ink/20",
        )}
      >
        <UserAvatar url={avatarUrl} name={displayName} size={36} />
      </button>

      {isOpen ? (
        <div
          id={menuId}
          role="menu"
          aria-label="Account"
          className={cn(
            "animate-fade-in-up absolute right-0 z-50 mt-2.5 w-72 max-w-[calc(100vw-1.5rem)] origin-top-right",
            "rounded-2xl bg-surface p-1.5 shadow-pop",
          )}
        >
          <Link
            href="/profile"
            role="menuitem"
            onClick={close}
            className="flex items-center gap-3 rounded-xl px-2.5 py-2.5 transition-colors hover:bg-ink/[0.05] focus-visible:bg-ink/[0.05] focus-visible:outline-none"
          >
            <UserAvatar url={avatarUrl} name={displayName} size={40} />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold tracking-tight text-ink">
                {displayName}
              </p>
              {showSecondary ? (
                <p className="truncate text-xs text-ink-2">{secondary}</p>
              ) : null}
              <p className="mt-1 text-xs font-medium text-accent">
                View profile
              </p>
            </div>
          </Link>

          <div className="mx-2.5 my-1 h-px bg-line" />

          <MenuRow
            href="/settings"
            icon={<LuSettings size={16} strokeWidth={1.75} />}
            onClick={close}
          >
            Settings
          </MenuRow>

          <div className="mx-2.5 my-1 h-px bg-line" />

          <MenuRow
            icon={<LuLogOut size={16} strokeWidth={1.75} />}
            onClick={() => {
              close();
              void onSignOut();
            }}
          >
            Sign out
          </MenuRow>
        </div>
      ) : null}
    </div>
  );
}
