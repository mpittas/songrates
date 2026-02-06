import { IconType } from "react-icons";

type BadgeVariant = "orange" | "emerald" | "blue" | "neutral";

interface BadgeProps {
  children: React.ReactNode;
  icon?: IconType;
  variant?: BadgeVariant;
  className?: string;
  title?: string;
}

const VARIANTS: Record<BadgeVariant, string> = {
  orange: "bg-orange-500/10 text-orange-400/80",
  emerald: "bg-emerald-500/10 text-emerald-400/70",
  blue: "bg-[#00f0ff]/5 text-[#00f0ff]/70",
  neutral: "bg-neutral-500/10 text-neutral-400/80",
};

export default function Badge({
  children,
  icon: Icon,
  variant = "neutral",
  className = "",
  title,
}: BadgeProps) {
  return (
    <span
      className={`flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-mono leading-none ${VARIANTS[variant]} ${className}`}
      title={title}
    >
      {Icon && <Icon size={10} />}
      {children}
    </span>
  );
}
