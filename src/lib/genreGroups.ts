import type { BrowsePill } from "@/lib/appleMusic/types";

export const GENRE_GROUP_IDS = ["sound", "place", "occasion"] as const;

export type GenreGroupId = (typeof GENRE_GROUP_IDS)[number];

export interface GenreGroupSection {
  id: GenreGroupId;
  title: string;
  description: string;
  pills: BrowsePill[];
}

const SOUND_LABELS = new Set(
  [
    "Alternative",
    "Blues",
    "Classical",
    "Country",
    "Dance",
    "Electronic",
    "Folk",
    "Hip-Hop/Rap",
    "Hip-Hop",
    "Indie",
    "Jazz",
    "Metal",
    "New Age",
    "Orchestral",
    "Pop",
    "R&B/Soul",
    "R&B",
    "Reggae",
    "Rock",
    "Singer/Songwriter",
    "Soul",
  ].map(normalizeLabel),
);

const PLACE_LABELS = new Set(
  [
    "African",
    "Arabic",
    "Brazilian",
    "Chinese",
    "Cuban",
    "Enka",
    "French Pop",
    "German Folk",
    "German Pop",
    "Indian",
    "J-Pop",
    "Jewish Music",
    "Kayokyoku",
    "Korean",
    "K-Pop",
    "Latin",
    "Latino",
    "Russian",
    "Tarab",
    "Turkish",
    "Worldwide",
    "World",
  ].map(normalizeLabel),
);

const OCCASION_LABELS = new Set(
  [
    "Anime",
    "Children's Music",
    "Christian",
    "Christian & Gospel",
    "Comedy",
    "Disney",
    "Easy Listening",
    "Fitness & Workout",
    "Holiday",
    "Inspirational",
    "Instrumental",
    "Marching",
    "Soundtrack",
    "Vocal",
  ].map(normalizeLabel),
);

function normalizeLabel(label: string): string {
  return label.trim().toLowerCase();
}

export function genreGroupIdForLabel(label: string): GenreGroupId {
  const key = normalizeLabel(label);
  if (PLACE_LABELS.has(key)) return "place";
  if (OCCASION_LABELS.has(key)) return "occasion";
  if (SOUND_LABELS.has(key)) return "sound";
  return "sound";
}

const GROUP_META: Record<
  GenreGroupId,
  { title: string; description: string }
> = {
  sound: {
    title: "By sound",
    description: "Core styles — pop, rock, jazz, and the rest of the crate.",
  },
  place: {
    title: "By place",
    description: "Scenes tied to a country, language, or region.",
  },
  occasion: {
    title: "For the moment",
    description: "Kids, holidays, scores, workouts, and other uses.",
  },
};

export function groupGenrePills(pills: BrowsePill[]): GenreGroupSection[] {
  const buckets: Record<GenreGroupId, BrowsePill[]> = {
    sound: [],
    place: [],
    occasion: [],
  };

  for (const pill of pills) {
    buckets[genreGroupIdForLabel(pill.label)].push(pill);
  }

  return GENRE_GROUP_IDS.filter((id) => buckets[id].length > 0).map((id) => ({
    id,
    title: GROUP_META[id].title,
    description: GROUP_META[id].description,
    pills: buckets[id],
  }));
}
