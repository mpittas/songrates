"use client";

import Link from "next/link";
import { useCallback, useRef } from "react";
import { usePrefetchArtist } from "@/hooks/useArtistData";

interface PrefetchLinkProps {
  href: string;
  artistId: string;
  children: React.ReactNode;
  className?: string;
  prefetchDelay?: number;
}

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
}: PrefetchLinkProps) {
  const prefetchArtist = usePrefetchArtist();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const hasPrefetched = useRef(false);

  const handleMouseEnter = useCallback(() => {
    // Only prefetch once per component instance
    if (hasPrefetched.current) return;

    // Slight delay to avoid prefetching on quick mouse passes
    timeoutRef.current = setTimeout(() => {
      prefetchArtist(artistId);
      hasPrefetched.current = true;
    }, prefetchDelay);
  }, [artistId, prefetchArtist, prefetchDelay]);

  const handleMouseLeave = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  return (
    <Link
      href={href}
      className={className}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {children}
    </Link>
  );
}
