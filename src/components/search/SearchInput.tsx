import { IoSearch, IoClose } from "react-icons/io5";

import {
  SearchInputProps,
  SearchInputSize,
  SearchInputVariant,
} from "@/types/search";

export default function SearchInput({
  value,
  onChange,
  onClear,
  onFocus,
  onBlur,
  isFocused,
  placeholder = "Search artists...",
  size = "large",
  variant = "dark",
}: SearchInputProps) {
  const isSmall = size === "small";
  const isCompact = size === "compact";
  const isDark = variant === "dark";

  return (
    <div
      className={`
        relative flex items-center w-full
        transition-all duration-200
        ${
          isDark
            ? "bg-[#0a0a0d] border border-[#1a1a1f]"
            : "bg-neutral-300 hover:border-[#2a2a35]"
        }
        ${
          isFocused
            ? "border-[#00f0ff]/50"
            : isDark
              ? "hover:border-[#00f0ff]/50"
              : "hover:border-[#2a2a35]"
        }
      `}
    >
      {/* Search Icon */}
      <div
        className={`transition-colors duration-200 ${
          isDark
            ? isFocused
              ? "text-[#00f0ff]"
              : "text-neutral-500"
            : isFocused
              ? "text-neutral-950"
              : "text-neutral-600"
        } ${isCompact ? "pl-2 pr-1.5" : isSmall ? "pl-3 pr-2" : "pl-5 pr-4"}`}
      >
        <IoSearch size={isCompact ? 12 : isSmall ? 16 : 20} />
      </div>

      {/* Input */}
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={onFocus}
        onBlur={onBlur}
        placeholder={placeholder}
        style={{ outline: "none" }}
        className={`flex-1 bg-transparent focus:outline-none font-mono ${
          isDark
            ? "text-neutral-200 placeholder:text-neutral-600"
            : "text-neutral-950 placeholder:text-neutral-600"
        } ${isCompact ? "py-1.5 text-xs" : isSmall ? "py-2 text-sm" : "py-3 text-lg"}`}
      />

      {/* Clear Button */}
      {value && (
        <button
          type="button"
          onClick={onClear}
          className={`transition-colors ${
            isDark
              ? "text-neutral-600 hover:text-white"
              : "text-neutral-600 hover:text-neutral-950"
          } ${isCompact ? "pr-2 pl-1.5" : isSmall ? "pr-3 pl-2" : "pr-5 pl-4"}`}
          aria-label="Clear search"
        >
          <IoClose size={isCompact ? 12 : isSmall ? 16 : 20} />
        </button>
      )}
    </div>
  );
}
