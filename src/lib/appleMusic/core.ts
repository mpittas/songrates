/**
 * Apple Music transport + shared constants.
 *
 * This module owns the core fetch layer (caching, conditional requests,
 * rate-limit backoff) and the storefront/revalidate config used by every
 * domain module. It imports nothing from the other appleMusic modules except
 * the auth helper, so it sits at the bottom of the dependency graph.
 */

import { getAppleMusicHeaders, APPLE_MUSIC_BASE_URL } from "./auth";

export const STOREFRONT = process.env.APPLE_MUSIC_STOREFRONT || "us";
export const APPLE_MUSIC_REVALIDATE_SECONDS = 21600;

// ─── Artwork URL helper ──────────────────────────────────────────────────────

/**
 * Resolve Apple Music artwork URL to requested dimensions.
 * Handles template URLs ({w}x{h}) and already-resolved CDN paths (e.g. 100x100bb).
 */
export function artworkUrl(
  urlTemplate: string | undefined,
  width: number = 300,
  height?: number,
): string {
  if (!urlTemplate) return "";
  const h = height ?? width;

  if (urlTemplate.includes("{w}") || urlTemplate.includes("{h}")) {
    return urlTemplate
      .replace("{w}", String(width))
      .replace("{h}", String(h));
  }

  return urlTemplate.replace(
    /\/(\d+)x(\d+)(bb|sr|cc)(-\d+)?(?=\.[a-z]|$)/i,
    `/${width}x${h}$3$4`,
  );
}

// ─── Core fetch ──────────────────────────────────────────────────────────────

/**
 * Per-URL cache of the most recent ETag / Last-Modified validators received
 * from Apple Music, plus the parsed body that came with them. Used to make
 * conditional requests (If-None-Match / If-Modified-Since) so an unchanged
 * resource collapses to a 304 and skips JSON parsing entirely.
 *
 * This sits *behind* Next's Data Cache: it only kicks in on a real network
 * fetch, when the Data Cache misses or revalidates.
 */
interface ValidatorEntry<T> {
  etag?: string;
  lastModified?: string;
  body: T;
}
const validators = new Map<string, ValidatorEntry<unknown>>();

/**
 * Options passed to a single Apple Music fetch.
 *
 * - tags: Next.js Data Cache tags for on-demand invalidation via revalidateTag().
 *   Use the helpers in appleTags (e.g. appleTags.artist(id)) so call sites and
 *   invalidations share a single naming convention.
 * - revalidate: per-data-class freshness window in seconds. Defaults to 6h.
 *   Lower this for charts/trending, keep it long for catalog metadata.
 * - signal: optional AbortSignal to cancel the in-flight request.
 */
export interface AppleMusicFetchOptions {
  tags?: string[];
  revalidate?: number;
  signal?: AbortSignal;
}

/**
 * Core Apple Music API fetch.
 *
 * Layers, applied in order:
 *   1. Next.js Data Cache (next.revalidate + next.tags) — usually stops here.
 *   2. HTTP conditional requests — when the Data Cache misses, replay the last
 *      ETag / Last-Modified so an unchanged payload returns 304 with no body.
 *
 * Returns null on hard failures (auth, 404, exhausted 429s, network errors),
 * matching the original contract. 304 is treated as a cache hit.
 */
export async function appleMusicFetch<T>(
  path: string,
  opts: AppleMusicFetchOptions = {},
): Promise<T | null> {
  const headers = await getAppleMusicHeaders();
  if (!headers) {
    console.error("Apple Music: failed to get auth headers");
    return null;
  }

  const url = `${APPLE_MUSIC_BASE_URL}${path}`;
  const revalidate = opts.revalidate ?? APPLE_MUSIC_REVALIDATE_SECONDS;

  const priorValidator = validators.get(url) as ValidatorEntry<T> | undefined;
  const requestHeaders: Record<string, string> = { ...headers };
  if (priorValidator?.etag) {
    requestHeaders["If-None-Match"] = priorValidator.etag;
  }
  if (priorValidator?.lastModified) {
    requestHeaders["If-Modified-Since"] = priorValidator.lastModified;
  }

  for (let attempt = 0; attempt <= 2; attempt++) {
    try {
      const res = await fetch(url, {
        headers: requestHeaders,
        next: { revalidate, tags: opts.tags },
        signal: opts.signal,
      });

      if (res.status === 304 && priorValidator) {
        // Unchanged — reuse the stored body, no JSON parsing cost.
        return priorValidator.body;
      }

      if (res.status === 429) {
        // Rate limited — wait and retry, honouring Retry-After with jitter.
        const retryAfter = Number(res.headers.get("Retry-After")) || 1;
        const delay = Math.min(retryAfter * 1000, 5000) * (attempt + 1);
        if (attempt < 2) {
          await new Promise((r) => setTimeout(r, delay));
          continue;
        }
        console.error(`Apple Music API 429 (exhausted retries) for ${path}`);
        return null;
      }

      if (!res.ok) {
        // 404 with "No related resources" is expected when paginating past the end
        if (res.status === 404) {
          return null;
        }
        const body = await res.text();
        console.error(
          `Apple Music API ${res.status} for ${path}:`,
          body.substring(0, 500),
        );
        return null;
      }

      const parsed = (await res.json()) as T;

      // Persist validators so the next revalidation can be conditional.
      const etag = res.headers.get("ETag") || undefined;
      const lastModified = res.headers.get("Last-Modified") || undefined;
      if (etag || lastModified) {
        validators.set(url, { etag, lastModified, body: parsed });
      }

      return parsed;
    } catch (err) {
      if (attempt < 2) {
        await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)));
        continue;
      }
      console.error("Apple Music fetch error for", url, ":", err);
      return null;
    }
  }

  return null;
}
