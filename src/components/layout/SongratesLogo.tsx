import { cn } from "@/lib/utils";

interface SongratesLogoProps {
  className?: string;
}

export default function SongratesLogo({ className }: SongratesLogoProps) {
  return (
    <span
      className={cn(
        "inline-flex items-baseline font-display text-[1.375rem] leading-none font-bold tracking-[-0.05em] text-ink md:text-[1.5rem]",
        className,
      )}
    >
      songrates
      <span className="text-accent">.</span>
    </span>
  );
}
