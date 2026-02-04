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
  const isDark = variant === "dark";

  return (
    <div
      className={`
        relative flex items-center w-full
        transition-all duration-200
        ${
          isDark
            ? "bg-neutral-900 hover:bg-neutral-800"
            : "bg-neutral-300 hover:border-[#2a2a35]"
        }
        ${
          isFocused
            ? "shadow-[0_0_0px_5px_rgba(0,240,255,0.2)]"
            : isDark
              ? "hover:border-[#2a2a35]"
              : "hover:border-[#2a2a35]"
        }
      `}
    >
      {/* Search Icon */}
      <div
        className={`transition-colors duration-200 ${
          isDark
            ? isFocused
              ? "text-white"
              : "text-neutral-400"
            : isFocused
              ? "text-neutral-950"
              : "text-neutral-600"
        } ${isSmall ? "pl-3 pr-2" : "pl-5 pr-4"}`}
      >
        <IoSearch size={isSmall ? 16 : 20} />
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
        className={`flex-1 bg-transparent focus:outline-none ${
          isDark
            ? "text-white placeholder:text-neutral-500"
            : "text-neutral-950 placeholder:text-neutral-600"
        } ${isSmall ? "py-2 text-sm" : "py-3 text-lg"}`}
      />

      {/* Clear Button */}
      {value && (
        <button
          type="button"
          onClick={onClear}
          className={`transition-colors ${
            isDark
              ? "text-neutral-500 hover:text-white"
              : "text-neutral-600 hover:text-neutral-950"
          } ${isSmall ? "pr-3 pl-2" : "pr-5 pl-4"}`}
          aria-label="Clear search"
        >
          <IoClose size={isSmall ? 16 : 20} />
        </button>
      )}
    </div>
  );
}
