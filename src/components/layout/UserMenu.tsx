"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import Drawer from "@/components/ui/Drawer";
import { FaUserCircle, FaSignOutAlt, FaStar } from "react-icons/fa";

interface UserMenuProps {
  user: User;
  onSignOut: () => Promise<void>;
  isMobile?: boolean;
}

export default function UserMenu({
  user,
  onSignOut,
  isMobile = false,
}: UserMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside (desktop only)
  useEffect(() => {
    if (isMobile) {
      if (isOpen) {
        document.body.style.overflow = "hidden";
      } else {
        document.body.style.overflow = "unset";
      }
      return () => {
        document.body.style.overflow = "unset";
      };
    }

    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, isMobile]);

  const avatarUrl = user.user_metadata?.avatar_url;
  const fullName = user.user_metadata?.full_name || user.email;

  // Internal DrawerContent removed in favor of reusable Drawer component

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-center rounded-full overflow-hidden border-2 border-transparent hover:border-neutral-700 transition-all focus:outline-none"
        aria-label="User menu"
      >
        {avatarUrl ? (
          <Image
            src={avatarUrl}
            alt="User Avatar"
            width={32}
            height={32}
            className="rounded-full"
          />
        ) : (
          <FaUserCircle className="text-neutral-400" size={32} />
        )}
      </button>

      {/* Desktop Dropdown */}
      {!isMobile && isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-neutral-950 border border-neutral-800 py-1 z-50 animate-in fade-in zoom-in-95 duration-100">
          <div className="px-4 py-2 border-b border-neutral-800">
            <p className="text-sm font-medium text-white truncate">
              {fullName}
            </p>
            <p className="text-xs text-neutral-500 truncate">{user.email}</p>
          </div>
          <Link
            href="/profile"
            className="flex items-center gap-3 px-4 py-2.5 text-sm text-neutral-300 hover:text-white hover:bg-white/5 transition-colors"
            onClick={() => setIsOpen(false)}
          >
            <FaUserCircle size={14} />
            Profile
          </Link>
          <Link
            href="/rated"
            className="flex items-center gap-3 px-4 py-2.5 text-sm text-neutral-300 hover:text-white hover:bg-white/5 transition-colors"
            onClick={() => setIsOpen(false)}
          >
            <FaStar size={14} />
            Rated
          </Link>
          <button
            onClick={() => {
              setIsOpen(false);
              onSignOut();
            }}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-neutral-300 hover:text-red-400 hover:bg-white/5 transition-colors text-left"
          >
            <FaSignOutAlt size={14} />
            Sign Out
          </button>
        </div>
      )}

      {/* Mobile Drawer */}
      {isMobile && (
        <Drawer
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          title="Profile"
        >
          <div className="flex flex-col gap-6">
            <div className="pb-6 border-b border-white/10">
              <div className="flex items-center gap-4 mb-3">
                {avatarUrl ? (
                  <Image
                    src={avatarUrl}
                    alt="User Avatar"
                    width={48}
                    height={48}
                    className="rounded-full"
                  />
                ) : (
                  <FaUserCircle className="text-neutral-400" size={48} />
                )}
                <div className="overflow-hidden">
                  <p className="text-sm font-medium text-white truncate">
                    {fullName}
                  </p>
                  <p className="text-xs text-neutral-500 truncate">
                    {user.email}
                  </p>
                </div>
              </div>
            </div>

            <nav className="flex flex-col gap-4">
              <Link
                href="/profile"
                className="flex items-center gap-3 text-base text-neutral-300 hover:text-white transition-colors uppercase tracking-widest"
                onClick={() => setIsOpen(false)}
              >
                <FaUserCircle size={16} />
                Profile
              </Link>
              <Link
                href="/rated"
                className="flex items-center gap-3 text-base text-neutral-300 hover:text-white transition-colors uppercase tracking-widest"
                onClick={() => setIsOpen(false)}
              >
                <FaStar size={16} />
                Rated
              </Link>
              <button
                onClick={() => {
                  setIsOpen(false);
                  onSignOut();
                }}
                className="flex items-center gap-3 text-base text-neutral-300 hover:text-red-400 transition-colors uppercase tracking-widest text-left mt-4"
              >
                <FaSignOutAlt size={16} />
                Sign Out
              </button>
            </nav>
          </div>
        </Drawer>
      )}
    </div>
  );
}
