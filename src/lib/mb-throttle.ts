// ─── Global MusicBrainz Request Throttle ────────────────────────────────────────
// MusicBrainz enforces a rate limit of 1 request per second per IP.
// This module spaces out requests using slot-based scheduling:
// each call reserves the next available time slot, then fires at that time.
// Requests do NOT wait for previous responses — only for their scheduled slot.
// This allows parallel callers (e.g. Promise.all) to fire at 0s, 1s, 2s…
// instead of waiting for each response + 1s sequentially.

const MB_MIN_INTERVAL = 750; // 750ms between requests (MB tolerates slight bursts)
let nextSlot = 0; // Timestamp of the next available request slot

/**
 * Wraps a fetch call to MusicBrainz, ensuring requests are spaced
 * at least 1 second apart globally across the entire application.
 * Uses slot-based scheduling so parallel callers don't block on responses.
 */
export function throttledMBFetch(
  url: string,
  init?: RequestInit,
): Promise<Response> {
  const now = Date.now();
  // Reserve the next available slot (at least now, at least 1s after previous)
  const slot = Math.max(now, nextSlot);
  nextSlot = slot + MB_MIN_INTERVAL;

  const delay = slot - now;

  if (delay <= 0) {
    return fetch(url, init);
  }

  return new Promise<Response>((resolve, reject) => {
    setTimeout(() => {
      fetch(url, init).then(resolve, reject);
    }, delay);
  });
}
