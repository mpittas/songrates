import { LuSearch, LuX } from "react-icons/lu";

import { SearchInputProps } from "@/types/search";
import { cn } from "@/lib/utils";

const SIZE = {
  compact: {
    container: "h-8 rounded-full",
    icon: 14,
    iconPad: "pl-3 pr-1.5",
    input: "text-[13px]",
    clearPad: "pr-2.5 pl-1",
  },
  small: {
    container: "h-10 rounded-full",
    icon: 16,
    iconPad: "pl-3.5 pr-2",
    input: "text-sm",
    clearPad: "pr-3 pl-1.5",
  },
  large: {
    container: "h-14 rounded-2xl sm:h-16",
    icon: 20,
    iconPad: "pl-5 pr-3",
    input: "text-base sm:text-lg",
    clearPad: "pr-5 pl-3",
  },
} as const;

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
  autoFocus,
  inputRef,
  shortcutHint,
}: SearchInputProps) {
  const isGlass = variant === "glass";
  const s = SIZE[size];

  return (
    <div
      className={cn(
        "relative flex w-full items-center border transition-[background-color,border-color,box-shadow] duration-200",
        s.container,
        isGlass
          ? isFocused
            ? "border-white/40 bg-white/[0.16] shadow-[0_8px_32px_rgb(0_0_0/0.35)] backdrop-blur-xl"
            : "border-white/20 bg-white/[0.1] backdrop-blur-xl hover:border-white/30 hover:bg-white/[0.14]"
          : isFocused
            ? "border-ink/20 bg-surface shadow-[0_0_0_4px_rgb(21_20_19/0.06)]"
            : "border-transparent bg-ink/[0.06] hover:bg-ink/[0.08]",
      )}
    >
      <span
        aria-hidden
        className={cn(
          "flex shrink-0 items-center",
          s.iconPad,
          isGlass
            ? isFocused
              ? "text-white"
              : "text-white/60"
            : isFocused
              ? "text-ink"
              : "text-ink-3",
        )}
      >
        <LuSearch size={s.icon} strokeWidth={2.25} />
      </span>

      <input
        ref={inputRef}
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={onFocus}
        onBlur={onBlur}
        autoFocus={autoFocus}
        placeholder={placeholder}
        aria-label={placeholder}
        enterKeyHint="search"
        className={cn(
          "h-full min-w-0 flex-1 bg-transparent outline-hidden [&::-webkit-search-cancel-button]:hidden",
          s.input,
          isGlass
            ? "text-white placeholder:text-white/55"
            : "text-ink placeholder:text-ink-3",
        )}
      />

      {value ? (
        <button
          type="button"
          onClick={onClear}
          className={cn(
            "flex h-full shrink-0 cursor-pointer items-center transition-colors",
            s.clearPad,
            isGlass
              ? "text-white/60 hover:text-white"
              : "text-ink-3 hover:text-ink",
          )}
          aria-label="Clear search"
        >
          <LuX size={s.icon} strokeWidth={2.25} />
        </button>
      ) : shortcutHint && !isFocused ? (
        <kbd
          aria-hidden
          className="mr-2.5 hidden h-5 min-w-5 shrink-0 items-center justify-center rounded-md border border-line-strong bg-surface px-1.5 font-mono text-[11px] text-ink-3 md:inline-flex"
        >
          {shortcutHint}
        </kbd>
      ) : null}
    </div>
  );
}
