import Image from "next/image";

import { cn } from "@/lib/utils";

type CoverProps = {
  url: string;
  alt: string;
  sizes: string;
  className?: string;
  priority?: boolean;
  quality?: number;
};

export default function Cover({
  url,
  alt,
  sizes,
  className,
  priority = false,
  quality,
}: CoverProps) {
  return (
    <div className={cn("relative overflow-hidden bg-neutral-800", className)}>
      {url ? (
        <Image
          src={url}
          alt={alt}
          fill
          sizes={sizes}
          quality={quality}
          className="object-cover"
          priority={priority}
        />
      ) : (
        <div
          className="absolute inset-0 bg-linear-to-br from-neutral-600 to-neutral-950"
          role="img"
          aria-label={alt}
        />
      )}
    </div>
  );
}
