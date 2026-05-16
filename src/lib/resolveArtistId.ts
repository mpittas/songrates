/**
 * Resolve an artist ID from a slug like "artist-name-12345"
 * (Apple Music catalog IDs are numeric.)
 */
export function resolveArtistId(slug: string): string {
  if (/^\d+$/.test(slug)) return slug;
  const parts = slug.split("-");
  const lastPart = parts[parts.length - 1];
  if (/^\d+$/.test(lastPart)) return lastPart;
  return slug;
}
