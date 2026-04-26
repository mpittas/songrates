import { IoSearch, IoClose } from "react-icons/io5";

import { SearchInputProps } from "@/types/search";

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
        rounded-xl transition-all duration-200
        ${
          isDark
            ? "bg-white border border-[#d9d9d9]"
            : "bg-white border border-[#d9d9d9]"
        }
        ${
          isFocused
            ? isDark
              ? "border-[#b9b9b9]"
              : "border-[#b9b9b9]"
            : isDark
              ? "hover:border-[#c8c8c8]"
              : "hover:border-[#c8c8c8]"
        }
      `}
    >
      {/* Search Icon */}
      <div
        className={`transition-colors duration-200 ${
          isDark
            ? isFocused
              ? "text-neutral-950"
              : "text-neutral-500"
            : isFocused
              ? "text-neutral-950"
              : "text-neutral-500"
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
            ? "text-neutral-900 placeholder:text-neutral-400"
            : "text-neutral-900 placeholder:text-neutral-400"
        } ${isCompact ? "py-1.5 text-xs" : isSmall ? "py-2 text-sm" : "py-3 text-lg"}`}
      />

      {/* Clear Button */}
      {value && (
        <button
          type="button"
          onClick={onClear}
          className={`transition-colors ${
            isDark
              ? "text-neutral-600 hover:text-neutral-950"
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
