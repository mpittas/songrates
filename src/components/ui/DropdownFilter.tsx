"use client";

import { useState, useRef, useEffect } from "react";
import { FaChevronDown } from "react-icons/fa";

interface Option<T extends string | number> {
  label: string;
  value: T;
}

interface DropdownFilterProps<T extends string | number> {
  label?: string;
  options: Option<T>[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
}

export default function DropdownFilter<T extends string | number>({
  label,
  options,
  value,
  onChange,
  className = "",
}: DropdownFilterProps<T>) {
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
        className="flex items-center gap-2 bg-white border border-[#d7d7d7] hover:border-[#c7c7c7] text-neutral-700 text-xs font-mono px-3 py-1.5 transition-colors w-full justify-between rounded"
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
        <div className="absolute top-full right-0 mt-1 w-full bg-white border border-[#d7d7d7] z-50 max-h-60 overflow-y-auto min-w-[120px] rounded-md shadow-lg">
          {options.map((option) => (
            <button
              key={option.value}
              onClick={() => {
                onChange(option.value);
                setIsOpen(false);
              }}
              className={`w-full text-left px-3 py-2 text-xs font-mono transition-colors hover:bg-[#f5f5f5] ${
                value === option.value ? "text-neutral-900" : "text-neutral-600"
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
