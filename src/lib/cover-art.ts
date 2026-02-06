export function getCoverArtUrl(
  releaseGroupId: string,
  title?: string,
  artist?: string,
): string {
  const params = new URLSearchParams({ id: releaseGroupId });
  if (title) params.set("title", title);
  if (artist) params.set("artist", artist);
  return `/api/proxy-image?${params.toString()}`;
}
