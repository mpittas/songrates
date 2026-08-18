"use client";

import { useArtworkPalette } from "@/hooks/useArtworkPalette";
import { artworkWashGradient } from "@/lib/artworkPalette";
import { cn } from "@/lib/utils";

export default function ArtworkColorWash({ src }: { src: string }) {
  const palette = useArtworkPalette(src);

  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 z-0 h-[500px] w-full overflow-hidden">
      <div
        aria-hidden
        data-artwork-wash="fallback"
        className={cn(
          "absolute inset-0 bg-linear-to-b from-[#f0e5df] to-[#f0e5df]/0 motion-safe:transition-opacity motion-safe:duration-700",
          palette ? "opacity-0" : "opacity-100",
        )}
      />
      <div
        aria-hidden
        data-artwork-wash="extracted"
        className={cn(
          "absolute inset-0 motion-safe:transition-opacity motion-safe:duration-700",
          palette ? "opacity-100" : "opacity-0",
        )}
        style={
          palette
            ? { backgroundImage: artworkWashGradient(palette) }
            : undefined
        }
      />
    </div>
  );
}
