"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  useCallback,
  type ComponentProps,
  type FocusEvent,
  type MouseEvent,
  type TouchEvent,
} from "react";

const prefetchedHrefs = new Set<string>();

function resolveHref(href: ComponentProps<typeof Link>["href"]): string {
  if (typeof href === "string") return href;
  return `${href.pathname ?? ""}${href.search ?? ""}${href.hash ?? ""}`;
}

/**
 * Catalog Link that skips viewport prefetch (which would warm dozens of ISR
 * album/artist/playlist pages at once) but prefetches on hover, focus, and
 * touch so the following click is served from the client router cache.
 */
export default function InstantLink({
  href,
  onMouseEnter,
  onFocus,
  onTouchStart,
  ...props
}: ComponentProps<typeof Link>) {
  const router = useRouter();

  const prefetchRoute = useCallback(() => {
    const url = resolveHref(href);
    if (
      !url ||
      url === "#" ||
      url.startsWith("#") ||
      url.startsWith("http") ||
      url.startsWith("mailto:") ||
      prefetchedHrefs.has(url)
    ) {
      return;
    }
    prefetchedHrefs.add(url);
    router.prefetch(url);
  }, [href, router]);

  return (
    <Link
      {...props}
      href={href}
      prefetch={false}
      onMouseEnter={(event: MouseEvent<HTMLAnchorElement>) => {
        prefetchRoute();
        onMouseEnter?.(event);
      }}
      onFocus={(event: FocusEvent<HTMLAnchorElement>) => {
        prefetchRoute();
        onFocus?.(event);
      }}
      onTouchStart={(event: TouchEvent<HTMLAnchorElement>) => {
        prefetchRoute();
        onTouchStart?.(event);
      }}
    />
  );
}
