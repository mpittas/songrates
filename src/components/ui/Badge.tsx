"use client";

interface BadgeProps {
  children: React.ReactNode;
  variant?: "orange" | "green" | "blue";
  className?: string;
  title?: string;
}

export default function Badge({
  children,
  variant = "blue",
  className = "",
  title,
}: BadgeProps) {
  const colorClasses = {
    orange: "bg-orange-500/10 text-orange-400/80 border-orange-500/20",
    green: "bg-emerald-500/10 text-emerald-400/70 border-emerald-500/15",
    blue: "bg-[#00f0ff]/5 text-[#00f0ff]/70 border-[#00f0ff]/10",
  };

  return (
    <span
      className={`text-[10px] font-mono px-1.5 py-0.5 ${colorClasses[variant]} ${className}`}
      title={title}
    >
      {children}
    </span>
  );
}
