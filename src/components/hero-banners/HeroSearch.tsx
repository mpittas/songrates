"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { IoSearch } from "react-icons/io5";

import { cn } from "@/lib/utils";

type HeroSearchVariant = "bloom" | "sleeve" | "stack" | "cut" | "river";

type HeroSearchProps = {
  variant: HeroSearchVariant;
  className?: string;
};

const PLACEHOLDER = "Search artists, albums, songs...";

export default function HeroSearch({ variant, className }: HeroSearchProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const next = query.trim();
    if (!next) return;
    router.push(`/?q=${encodeURIComponent(next)}`);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={cn("w-full", className)}
      role="search"
    >
      <div className={shellClass[variant]}>
        <IoSearch aria-hidden className={iconClass[variant]} />
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={PLACEHOLDER}
          aria-label={PLACEHOLDER}
          className={inputClass[variant]}
        />
        <button type="submit" className={buttonClass[variant]}>
          Search
        </button>
      </div>
    </form>
  );
}

const shellClass: Record<HeroSearchVariant, string> = {
  bloom:
    "flex items-center rounded-xl border border-black/10 bg-white shadow-[0_18px_40px_rgba(143,29,40,0.12)]",
  sleeve:
    "flex items-center rounded-none border border-neutral-900 bg-white",
  stack:
    "flex items-center rounded-sm border border-[#d8f56a]/35 bg-[#10211c]",
  cut: "flex items-center rounded-md border border-white/15 bg-white/8",
  river:
    "flex items-center rounded-full border border-white/15 bg-[#141414]",
};

const iconClass: Record<HeroSearchVariant, string> = {
  bloom: "ml-4 size-5 shrink-0 text-[#8f1d28]",
  sleeve: "ml-3 size-5 shrink-0 text-neutral-900",
  stack: "ml-4 size-5 shrink-0 text-[#d8f56a]",
  cut: "ml-4 size-5 shrink-0 text-white/70",
  river: "ml-5 size-5 shrink-0 text-white/70",
};

const inputClass: Record<HeroSearchVariant, string> = {
  bloom:
    "min-w-0 flex-1 bg-transparent px-3 py-3.5 text-base text-neutral-900 outline-hidden placeholder:text-neutral-400",
  sleeve:
    "min-w-0 flex-1 bg-transparent px-3 py-3 text-base text-neutral-900 outline-hidden placeholder:text-neutral-400",
  stack:
    "min-w-0 flex-1 bg-transparent px-3 py-3.5 text-base text-[#f3ede4] outline-hidden placeholder:text-[#f3ede4]/40",
  cut: "min-w-0 flex-1 bg-transparent px-3 py-3.5 text-base text-white outline-hidden placeholder:text-white/40",
  river:
    "min-w-0 flex-1 bg-transparent px-3 py-3.5 text-base text-white outline-hidden placeholder:text-white/40",
};

const buttonClass: Record<HeroSearchVariant, string> = {
  bloom:
    "m-1.5 cursor-pointer rounded-lg bg-[#8f1d28] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#6e151e] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#8f1d28]",
  sleeve:
    "cursor-pointer self-stretch bg-neutral-900 px-5 text-xs font-semibold tracking-[0.14em] text-white uppercase transition-colors hover:bg-black focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-900",
  stack:
    "m-1.5 cursor-pointer rounded-sm bg-[#d8f56a] px-4 py-2.5 text-sm font-semibold text-[#10211c] transition-colors hover:bg-[#e7ff8a] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#d8f56a]",
  cut: "m-1 cursor-pointer rounded-md bg-[#ff6a3d] px-4 py-2.5 text-sm font-semibold text-[#0a0a0a] transition-colors hover:bg-[#ff825c] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ff6a3d]",
  river:
    "m-1 cursor-pointer rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-black transition-colors hover:bg-neutral-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white",
};
