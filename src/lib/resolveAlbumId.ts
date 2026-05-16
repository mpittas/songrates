/**
 * Extract the numeric Apple Music ID from a slug like "album-name-1440833849"
 */
export function resolveAlbumId(slug: string): string {
  if (/^\d+$/.test(slug)) return slug;
  const parts = slug.split("-");
  const lastPart = parts[parts.length - 1];
  if (/^\d+$/.test(lastPart)) return lastPart;
  return slug;
}
