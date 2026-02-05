"use client";

import Link from "next/link";
import { useCallback, useRef, MouseEvent } from "react";
import { usePrefetchArtist } from "@/hooks/useArtistData";

import { PrefetchLinkProps } from "@/types/ui";

/**
 * Link component that prefetches artist data on hover
 * This preloads artist info, albums, and releases before user clicks
 */
export default function PrefetchLink({
  href,
  artistId,
  children,
  className,
  prefetchDelay = 100,
  ...props
}: PrefetchLinkProps) {
  const prefetchArtist = usePrefetchArtist();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const hasPrefetched = useRef(false);

  const handleMouseEnter = useCallback(
    (e: MouseEvent<HTMLAnchorElement>) => {
      // Only prefetch once per component instance
      if (hasPrefetched.current) return;

      // Slight delay to avoid prefetching on quick mouse passes
      timeoutRef.current = setTimeout(() => {
        prefetchArtist(artistId);
        hasPrefetched.current = true;
      }, prefetchDelay);

      props.onMouseEnter?.(e);
    },
    [artistId, prefetchArtist, prefetchDelay, props.onMouseEnter],
  );

  const handleMouseLeave = useCallback(
    (e: MouseEvent<HTMLAnchorElement>) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      props.onMouseLeave?.(e);
    },
    [props.onMouseLeave],
  );

  return (
    <Link
      href={href}
      className={className}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      {...props}
    >
      {children}
    </Link>
  );
}
