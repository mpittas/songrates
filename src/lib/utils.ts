/**
 * Shared utility functions
 */

/**
 * Format seconds to MM:SS display format
 * @param seconds - Time in seconds
 * @returns Formatted time string (e.g., "3:45")
 */
export function formatTimeSeconds(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

/**
 * Format milliseconds to MM:SS display format
 * @param ms - Time in milliseconds (optional)
 * @returns Formatted time string (e.g., "3:45") or "-:--" if undefined
 */
export function formatTimeMs(ms?: number): string {
  if (!ms) return "-:--";
  const minutes = Math.floor(ms / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

/**
 * Format a relative time ago string from a timestamp
 * @param timestamp - Unix timestamp in milliseconds
 * @returns Human-readable relative time (e.g., "2h", "5m", "3d")
 */
export function formatTimeAgo(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;

  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (minutes < 1) return "now";
  if (minutes < 60) return `${minutes}m`;
  if (hours < 24) return `${hours}h`;
  return `${days}d`;
}
