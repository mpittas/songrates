/**
 * Shared utility functions
 */

/**
 * Combine class names
 */
export function cn(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(" ");
}

/**
 * Format time to MM:SS display format
 * @param time - Time in seconds (number) or milliseconds (number), or undefined
 * @param unit - Unit of the input time: 'seconds' or 'milliseconds'
 * @returns Formatted time string (e.g., "3:45") or "-:--" if undefined/invalid
 */
export function formatTime(
  time?: number | null,
  unit: "seconds" | "milliseconds" = "seconds",
): string {
  if (time === undefined || time === null || time < 0) return "-:--";

  const totalSeconds =
    unit === "milliseconds" ? Math.floor(time / 1000) : Math.floor(time);
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;

  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

/**
 * @param timestamp
 * @returns
 */
export function formatTimeAgo(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;

  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (minutes < 60) return `${minutes}m`;
  if (hours < 24) return `${hours}h`;
  return `${days}d`;
}

/**
 * Create a slug from a name and ID
 * @param name - The name to slugify (e.g., "The Beatles")
 * @param id - The ID to append (e.g., "uuid")
 * @returns A slug string with short ID (e.g., "the-beatles-75a72702")
 */
export function createSlug(name: string, id: string): string {
  if (!name) return id;
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-") // Replace non-alphanumeric chars with hyphens
    .replace(/^-+|-+$/g, ""); // Remove leading/trailing hyphens

  // Use first 8 chars of ID for cleaner URLs
  const shortId = id.split("-")[0];
  return `${slug}-${shortId}`;
}
