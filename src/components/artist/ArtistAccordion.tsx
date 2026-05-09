"use client";

import { useState, type ReactNode } from "react";
import { FaChevronDown, FaChevronUp } from "react-icons/fa";
import { HiOutlineCollection } from "react-icons/hi";
import Button from "@/components/ui/Button";

interface ArtistAccordionProps {
  title: string;
  count: number;
  children: React.ReactNode;
  /** Section icon; defaults to a generic collection glyph */
  icon?: ReactNode;
  defaultOpen?: boolean;
}

export default function ArtistAccordion({
  title,
  count,
  children,
  icon,
  defaultOpen = true,
}: ArtistAccordionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  if (count === 0) return null;

  return (
    <div>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="h-8 w-full justify-between gap-4 rounded-md bg-white px-3 py-1 text-left hover:bg-white active:scale-100 cursor-pointer"
      >
        <span className="flex min-w-0 items-center gap-1 font-mono text-xs uppercase text-neutral-950">
          <span className="mr-0.5 inline-flex shrink-0 text-neutral-400 [&>svg]:size-[13px]">
            {icon ?? <HiOutlineCollection size={13} />}
          </span>
          <span className="truncate">{title}</span>
          <span>({count})</span>
        </span>
        <span className="ml-auto shrink-0 text-neutral-500 transition-transform duration-300 ease-out">
          {isOpen ? <FaChevronUp size={10} /> : <FaChevronDown size={10} />}
        </span>
      </Button>
      <div
        className={`grid transition-[grid-template-rows,opacity] duration-300 ease-out ${
          isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
        }`}
      >
        {/* overflow-hidden is required for the 0fr collapse animation; when open,
            overflow-visible so absolutely positioned popovers (e.g. SongRowRating) are not clipped. */}
        <div
          className={`min-h-0 ${isOpen ? "overflow-visible" : "overflow-hidden"}`}
        >
          <div className="bg-transparent pt-2">{children}</div>
        </div>
      </div>
    </div>
  );
}
