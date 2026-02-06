"use client";

import { IoFlame } from "react-icons/io5";

interface ListenCountBadgeProps {
  listenCount: number;
  className?: string;
  variant?: "orange" | "green";
}

export default function ListenCountBadge({
  listenCount,
  className = "",
  variant = "orange",
}: ListenCountBadgeProps) {
  if (listenCount == null || listenCount <= 0) return null;

  const colorClasses = {
    orange: "bg-orange-500/10 text-orange-400/80 border-orange-500/20",
    green: "bg-emerald-500/10 text-emerald-400/70 border-emerald-500/15",
  };

  return (
    <span
      className={`text-[10px] font-mono px-1.5 py-0.5 ${colorClasses[variant]} flex items-center gap-0.5 ${className}`}
      title={`${listenCount.toLocaleString()} total plays on Last.fm`}
    >
      <IoFlame size={10} />
      {listenCount >= 1_000_000
        ? `${(listenCount / 1_000_000).toFixed(1)}M`
        : listenCount >= 1000
          ? `${Math.round(listenCount / 1000)}k`
          : listenCount}
    </span>
  );
}
