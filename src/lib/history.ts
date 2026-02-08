import { ArtistVisit } from "@/types/artist";

const HISTORY_KEY = "songrates_artist_history";
const MAX_HISTORY = 10;

export function getArtistHistory(): ArtistVisit[] {
  if (typeof window === "undefined") return [];

  try {
    const stored = localStorage.getItem(HISTORY_KEY);
    if (!stored) return [];
    const parsed: ArtistVisit[] = JSON.parse(stored);
    // Filter out old MusicBrainz UUID-style entries
    return parsed.filter((item) => !isMusicBrainzId(item.id));
  } catch {
    return [];
  }
}

export function addToHistory(
  id: string,
  name: string,
  thumbnailUrl?: string,
): void {
  if (typeof window === "undefined") return;

  try {
    const history = getArtistHistory();

    // Filter out the current entry and any old MusicBrainz UUID-style entries
    const filtered = history.filter(
      (item) => item.id !== id && !isMusicBrainzId(item.id),
    );

    const newHistory = [
      { id, name, visitedAt: Date.now(), thumbnailUrl },
      ...filtered,
    ].slice(0, MAX_HISTORY);

    localStorage.setItem(HISTORY_KEY, JSON.stringify(newHistory));
  } catch (error) {
    console.error("Failed to save artist history:", error);
  }
}

/** MusicBrainz IDs are UUIDs (8-4-4-4-12 hex chars). Filter them out. */
function isMusicBrainzId(id: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    id,
  );
}

export function clearHistory(): void {
  if (typeof window === "undefined") return;

  try {
    localStorage.removeItem(HISTORY_KEY);
  } catch (error) {
    console.error("Failed to clear history:", error);
  }
}
