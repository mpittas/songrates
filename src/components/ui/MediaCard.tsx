import type { ReactNode } from "react";

import InstantLink from "@/components/ui/InstantLink";
import OptimizedImage from "@/components/ui/OptimizedImage";
import { cn } from "@/lib/utils";

export interface MediaCardProps {
  href: string;
  imageUrl?: string | null;
  title: string;
  subtitle?: ReactNode;
  priority?: boolean;
  shape?: "square" | "circle";
  /** Rendered over the artwork (score badges, labels). */
  overlay?: ReactNode;
  className?: string;
}

/** Shared artwork-first card for albums, playlists and artists. */
export default function MediaCard({
  href,
  imageUrl,
  title,
  subtitle,
  priority = false,
  shape = "square",
  overlay,
  className,
}: MediaCardProps) {
  const isCircle = shape === "circle";

  return (
    <InstantLink
      href={href}
      className={cn(
        "group block min-w-0 rounded-xl outline-offset-4",
        isCircle && "text-center",
        className,
      )}
    >
      <MediaCardArt
        imageUrl={imageUrl}
        alt={title}
        priority={priority}
        shape={shape}
      >
        {overlay}
      </MediaCardArt>
      <div className="mt-3 min-w-0">
        <h3 className="truncate text-[14px] leading-5 font-medium tracking-[-0.01em] text-ink">
          {title}
        </h3>
        {subtitle ? (
          <p className="truncate text-[13px] leading-5 text-ink-2">
            {subtitle}
          </p>
        ) : null}
      </div>
    </InstantLink>
  );
}

/** Artwork tile with the shared radius, hairline and hover lift. */
export function MediaCardArt({
  imageUrl,
  alt,
  priority = false,
  shape = "square",
  radius: squareRadius = "xl",
  lift = true,
  className,
  children,
}: {
  imageUrl?: string | null;
  alt: string;
  priority?: boolean;
  shape?: "square" | "circle";
  /** Corner radius for square artwork. */
  radius?: "md" | "lg" | "xl";
  /** Raise the artwork when the parent `group` is hovered. */
  lift?: boolean;
  className?: string;
  children?: ReactNode;
}) {
  const radius =
    shape === "circle"
      ? "rounded-full"
      : { md: "rounded-md", lg: "rounded-lg", xl: "rounded-xl" }[squareRadius];

  return (
    <div
      className={cn(
        "relative aspect-square overflow-hidden bg-subtle",
        lift &&
          "transition-[transform,box-shadow] duration-300 ease-out group-hover:-translate-y-1 group-hover:shadow-lift motion-reduce:transition-none motion-reduce:group-hover:translate-y-0",
        radius,
        className,
      )}
    >
      <OptimizedImage
        src={imageUrl || "/vinyl-placeholder.svg"}
        alt={alt}
        fill
        priority={priority}
        className="object-cover"
        fallbackSrc="/vinyl-placeholder.svg"
      />
      <div
        aria-hidden
        className={cn(
          "pointer-events-none absolute inset-0 ring-1 ring-black/[0.06] ring-inset",
          radius,
        )}
      />
      {children}
    </div>
  );
}
