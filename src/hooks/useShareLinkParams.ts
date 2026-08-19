"use client";

import { useMemo, useSyncExternalStore } from "react";

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

const listeners = new Set<() => void>();
let historyPatched = false;
let originalPushState: History["pushState"] | undefined;
let originalReplaceState: History["replaceState"] | undefined;
let emitQueued = false;

function emitLocationChange() {
  // Next.js writes history inside useInsertionEffect. Notifying
  // useSyncExternalStore from that phase schedules a React update and
  // throws "useInsertionEffect must not schedule updates." Defer to a
  // macrotask so the commit finishes first.
  if (emitQueued) return;
  emitQueued = true;
  setTimeout(() => {
    emitQueued = false;
    listeners.forEach((listener) => listener());
  }, 0);
}

function ensureHistoryPatched() {
  if (historyPatched || typeof window === "undefined") return;
  historyPatched = true;
  originalPushState = history.pushState;
  originalReplaceState = history.replaceState;
  history.pushState = function (...args) {
    const result = originalPushState!.apply(this, args);
    emitLocationChange();
    return result;
  };
  history.replaceState = function (...args) {
    const result = originalReplaceState!.apply(this, args);
    emitLocationChange();
    return result;
  };
  window.addEventListener("popstate", emitLocationChange);
}

function subscribeToLocation(onStoreChange: () => void) {
  ensureHistoryPatched();
  listeners.add(onStoreChange);
  return () => {
    listeners.delete(onStoreChange);
  };
}

function getSearchSnapshot() {
  return window.location.search;
}

function getServerSearchSnapshot() {
  return "";
}

function parseShareLinkParams(search: string): ShareLinkParams {
  if (!search) return EMPTY;
  const sp = new URLSearchParams(search);
  return {
    userId: sp.get("userId") || null,
    track: sp.get("track") || null,
    userName: sp.get("userName") || null,
  };
}

/**
 * Reads the album share-link query params (`userId`, `track`, `userName`)
 * on the client only, after hydration.
 *
 * This is deliberately NOT read on the server / during SSR so that the
 * server-rendered HTML (and therefore the ISR/CDN cache key) depends solely
 * on the album path — not on the query string. Reading `searchParams` on the
 * server would force the route fully dynamic and bust the cache for every
 * unique share-link URL. Returns `null` values on first render, then updates
 * once the browser URL is available — including client-side navigations
 * that only change the query string (e.g. clicking a search song on the
 * same album).
 */
export function useShareLinkParams(): ShareLinkParams {
  const search = useSyncExternalStore(
    subscribeToLocation,
    getSearchSnapshot,
    getServerSearchSnapshot,
  );

  return useMemo(() => parseShareLinkParams(search), [search]);
}
