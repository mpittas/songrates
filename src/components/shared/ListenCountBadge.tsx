import { IoFlame } from "react-icons/io5";
import Badge from "./Badge";

interface ListenCountBadgeProps {
  count: number;
  className?: string;
}

export default function ListenCountBadge({
  count,
  className = "",
}: ListenCountBadgeProps) {
  if (!count || count <= 0) return null;

  return (
    <Badge
      variant="orange"
      icon={IoFlame}
      className={`hidden sm:flex ${className}`}
      title={`${count.toLocaleString()} total listens on Last.fm`}
    >
      {count >= 1_000_000
        ? `${(count / 1_000_000).toFixed(1)}M`
        : count >= 1_000
          ? `${Math.round(count / 1_000)}k`
          : count}
    </Badge>
  );
}
