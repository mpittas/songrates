import { IoSearch, IoClose } from "react-icons/io5";

import { SearchInputProps } from "@/types/search";
import { cn } from "@/lib/utils";

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
    ? isFocused
      ? "border-white/40 bg-white/15"
      : "border-white/25 bg-white/20 hover:border-white/35 hover:bg-white/12"
    : isFocused
      ? "border-[#b9b9b9] bg-white"
      : "border-[#d9d9d9] bg-white hover:border-[#c8c8c8]";

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
      className={cn(
        "relative flex w-full items-center rounded-xl border backdrop-blur-md transition-colors duration-200",
        !isGlass && "backdrop-blur-none",
        containerClass,
      )}
    >
      <div
        className={cn(
          iconClass,
          isCompact ? "pr-1.5 pl-2" : isSmall ? "pr-2 pl-3" : "pr-4 pl-5",
        )}
      >
        <IoSearch size={isCompact ? 12 : isSmall ? 16 : 20} />
      </div>

      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={onFocus}
        onBlur={onBlur}
        placeholder={placeholder}
        aria-label={placeholder}
        className={cn(
          "flex-1 bg-transparent outline-hidden",
          inputClass,
          isCompact ? "py-1.5 text-xs" : isSmall ? "py-2 text-sm" : "py-3 text-lg",
        )}
      />

      {value ? (
        <button
          type="button"
          onClick={onClear}
          className={cn(
            "cursor-pointer transition-colors",
            clearClass,
            isCompact ? "pr-2 pl-1.5" : isSmall ? "pr-3 pl-2" : "pr-5 pl-4",
          )}
          aria-label="Clear search"
        >
          <IoClose size={isCompact ? 12 : isSmall ? 16 : 20} />
        </button>
      ) : null}
    </div>
  );
}
