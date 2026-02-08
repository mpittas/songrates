/**
 * ytmusic.ts — YTMusic API singleton
 *
 * Provides a lazily-initialized, reusable YTMusic instance for server-side use.
 * The instance is created once and reused across requests.
 */

import YTMusic from "ytmusic-api";

let ytmusicInstance: YTMusic | null = null;
let initPromise: Promise<YTMusic> | null = null;

/**
 * Get (or create) the singleton YTMusic instance.
 * Safe to call from multiple concurrent requests — only initializes once.
 */
export async function getYTMusic(): Promise<YTMusic> {
  if (ytmusicInstance) return ytmusicInstance;

  if (!initPromise) {
    initPromise = (async () => {
      const yt = new YTMusic();
      await yt.initialize();
      ytmusicInstance = yt;
      return yt;
    })();
  }

  return initPromise;
}
