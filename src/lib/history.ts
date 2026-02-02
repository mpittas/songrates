import { ArtistVisit } from "@/types/artist";

const HISTORY_KEY = "songrates_artist_history";
const MAX_HISTORY = 10;

export function getArtistHistory(): ArtistVisit[] {
  if (typeof window === "undefined") return [];

  try {
    const stored = localStorage.getItem(HISTORY_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

export function addToHistory(id: string, name: string): void {
  if (typeof window === "undefined") return;

  try {
    const history = getArtistHistory();

    const filtered = history.filter((item) => item.id !== id);

    const newHistory = [{ id, name, visitedAt: Date.now() }, ...filtered].slice(
      0,
      MAX_HISTORY,
    );

    localStorage.setItem(HISTORY_KEY, JSON.stringify(newHistory));
  } catch (error) {
    console.error("Failed to save artist history:", error);
  }
}

export function clearHistory(): void {
  if (typeof window === "undefined") return;

  try {
    localStorage.removeItem(HISTORY_KEY);
  } catch (error) {
    console.error("Failed to clear history:", error);
  }
}
