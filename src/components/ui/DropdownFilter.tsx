"use client";

import { useState, useRef, useEffect } from "react";
import { FaChevronDown } from "react-icons/fa";

interface Option {
  label: string;
  value: string | number;
}

interface DropdownFilterProps {
  label?: string;
  options: Option[];
  value: string | number;
  onChange: (value: any) => void;
  className?: string;
}

export default function DropdownFilter({
  label,
  options,
  value,
  onChange,
  className = "",
}: DropdownFilterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((o) => o.value === value) || options[0];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div
      className={`relative flex items-center gap-2 ${className}`}
      ref={containerRef}
    >
      {label && (
        <span className="text-xs text-neutral-500 font-mono whitespace-nowrap">
          {label}
        </span>
      )}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 bg-[#0a0a0d] border border-[#1a1a1f] hover:border-[#00f0ff]/50 text-neutral-400 text-xs font-mono px-3 py-1.5 transition-colors w-full justify-between"
      >
        <span className="truncate">{selectedOption.label}</span>
        <FaChevronDown
          size={10}
          className={`text-neutral-500 transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {isOpen && (
        <div className="absolute top-full right-0 mt-1 w-full bg-[#0a0a0d] border border-[#1a1a1f] z-50 max-h-60 overflow-y-auto min-w-[120px]">
          {options.map((option) => (
            <button
              key={option.value}
              onClick={() => {
                onChange(option.value);
                setIsOpen(false);
              }}
              className={`w-full text-left px-3 py-2 text-xs font-mono transition-colors hover:bg-white/5 ${
                value === option.value ? "text-[#00f0ff]" : "text-neutral-300"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
