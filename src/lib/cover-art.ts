export function getCoverArtUrl(releaseGroupId: string): string {
  return `/api/proxy-image?id=${encodeURIComponent(releaseGroupId)}`;
}
