// ─── Global MusicBrainz Request Throttle ────────────────────────────────────────
// MusicBrainz enforces a rate limit of 1 request per second per IP.
// This module ensures all MB API calls across the app are serialized
// with a minimum 1-second gap between requests to avoid 503 errors.

const MB_MIN_INTERVAL = 1100; // 1.1s between requests (safe margin)
let lastRequestTime = 0;
let queue: Promise<void> = Promise.resolve();

/**
 * Wraps a fetch call to MusicBrainz, ensuring requests are spaced
 * at least 1.1 seconds apart globally across the entire application.
 */
export function throttledMBFetch(
  url: string,
  init?: RequestInit,
): Promise<Response> {
  // Chain onto the queue so requests are serialized
  const request = queue.then(async () => {
    const now = Date.now();
    const elapsed = now - lastRequestTime;
    if (elapsed < MB_MIN_INTERVAL) {
      await new Promise((r) => setTimeout(r, MB_MIN_INTERVAL - elapsed));
    }
    lastRequestTime = Date.now();
    return fetch(url, init);
  });

  // Update the queue — next request waits for this one to start
  queue = request.then(
    () => {},
    () => {},
  );

  return request;
}
