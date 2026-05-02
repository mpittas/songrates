"use client";

import { useState } from "react";
import { FaChevronDown, FaChevronUp } from "react-icons/fa";
import { HiOutlineCollection } from "react-icons/hi";
import Button from "@/components/ui/Button";

interface ArtistAccordionProps {
  title: string;
  count: number;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

export default function ArtistAccordion({
  title,
  count,
  children,
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
        className="h-6 w-full justify-between gap-4 rounded-md bg-white px-3 py-1 text-left hover:bg-white active:scale-100"
      >
        <span className="flex min-w-0 items-center gap-1.5 font-mono text-[9px] uppercase tracking-widest text-neutral-500">
          <HiOutlineCollection size={11} className="text-neutral-500" />
          <span className="truncate">{title}</span>
          <span className="text-neutral-700">({count})</span>
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
        <div className="min-h-0 overflow-hidden">
          <div className="bg-transparent pt-2">{children}</div>
        </div>
      </div>
    </div>
  );
}
