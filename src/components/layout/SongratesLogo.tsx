import { cn } from "@/lib/utils";

interface SongratesLogoProps {
  className?: string;
}

export default function SongratesLogo({ className }: SongratesLogoProps) {
  return (
    <span
      className={cn(
        "inline-block text-[1.35rem] font-bold leading-none tracking-[-0.04em] text-neutral-900 md:text-[1.5rem]",
        className,
      )}
    >
      songrates.
    </span>
  );
}
