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
 * @deprecated Use formatTime(seconds, 'seconds') instead
 */
export function formatTimeSeconds(seconds: number): string {
  return formatTime(seconds, "seconds");
}

/**
 * @deprecated Use formatTime(ms, 'milliseconds') instead
 */
export function formatTimeMs(ms?: number): string {
  return formatTime(ms, "milliseconds");
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
