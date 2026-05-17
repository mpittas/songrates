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
  const isGlass = variant === "glass";

  const containerClass = isGlass
    ? `bg-white/20 backdrop-blur-md ${
        isFocused
          ? "border-white/40 bg-white/15"
          : "border-white/25 hover:border-white/35 hover:bg-white/12"
      }`
    : "bg-white border border-[#d9d9d9] " +
      (isFocused ? "border-[#b9b9b9]" : "hover:border-[#c8c8c8]");

  const iconClass = isGlass
    ? isFocused
      ? "text-white"
      : "text-white/60"
    : isFocused
      ? "text-neutral-950"
      : "text-neutral-500";

  const inputClass = isGlass
    ? "text-white placeholder:text-white/50"
    : "text-neutral-900 placeholder:text-neutral-400";

  const clearClass = isGlass
    ? "text-white/60 hover:text-white"
    : "text-neutral-600 hover:text-neutral-950";

  return (
    <div
      className={`
        relative flex items-center w-full
        rounded-xl transition-all duration-200
        ${containerClass}
      `}
    >
      <div
        className={`transition-colors duration-200 ${iconClass} ${
          isCompact ? "pl-2 pr-1.5" : isSmall ? "pl-3 pr-2" : "pl-5 pr-4"
        }`}
      >
        <IoSearch size={isCompact ? 12 : isSmall ? 16 : 20} />
      </div>

      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={onFocus}
        onBlur={onBlur}
        placeholder={placeholder}
        style={{ outline: "none" }}
        className={`flex-1 bg-transparent focus:outline-none font-mono ${inputClass} ${
          isCompact
            ? "py-1.5 text-xs"
            : isSmall
              ? "py-2 text-sm"
              : "py-3 text-lg"
        }`}
      />

      {value && (
        <button
          type="button"
          onClick={onClear}
          className={`transition-colors ${clearClass} ${
            isCompact ? "pr-2 pl-1.5" : isSmall ? "pr-3 pl-2" : "pr-5 pl-4"
          }`}
          aria-label="Clear search"
        >
          <IoClose size={isCompact ? 12 : isSmall ? 16 : 20} />
        </button>
      )}
    </div>
  );
}
