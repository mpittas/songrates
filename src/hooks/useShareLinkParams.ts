"use client";

import { useEffect, useState } from "react";

export interface ShareLinkParams {
  userId: string | null;
  track: string | null;
  userName: string | null;
}

const EMPTY: ShareLinkParams = {
  userId: null,
  track: null,
  userName: null,
};

/**
 * Reads the album share-link query params (`userId`, `track`, `userName`)
 * on the client only, after hydration.
 *
 * This is deliberately NOT read on the server / during SSR so that the
 * server-rendered HTML (and therefore the ISR/CDN cache key) depends solely
 * on the album path — not on the query string. Reading `searchParams` on the
 * server would force the route fully dynamic and bust the cache for every
 * unique share-link URL. Returns `null` values on first render, then updates
 * once the browser URL is available.
 */
export function useShareLinkParams(): ShareLinkParams {
  const [params, setParams] = useState<ShareLinkParams>(EMPTY);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const sp = new URLSearchParams(window.location.search);
    setParams({
      userId: sp.get("userId") || null,
      track: sp.get("track") || null,
      userName: sp.get("userName") || null,
    });
  }, []);

  return params;
}
