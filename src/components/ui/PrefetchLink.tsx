"use client";

import Link from "next/link";

import { PrefetchLinkProps } from "@/types/ui";

/**
 * Link component for artist pages.
 * Next.js handles route prefetching automatically.
 */
export default function PrefetchLink({
  href,
  artistId,
  children,
  className,
  prefetchDelay,
  ...props
}: PrefetchLinkProps) {
  return (
    <Link href={href} className={className} {...props}>
      {children}
    </Link>
  );
}
