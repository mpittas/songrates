import { isFullyRatedAlbum, isPartiallyRatedAlbum } from "@/lib/albumPageStats";

/**
 * Profile leveling catalog.
 * Album / review thresholds and the level formula must match
 * `private.recompute_user_progression` (007 + 009 + 010 migrations).
 *
 * XP is still stored (weighted by album type) but does not grant ranks.
 */

export const XP_BY_ALBUM_TYPE = {
  Album: 100,
  EP: 60,
  Compilation: 40,
  Single: 15,
} as const;

export type ReleaseAlbumType = keyof typeof XP_BY_ALBUM_TYPE;

export const MAX_LEVEL = 5;
export const MIN_LEVEL = 0;

export const RANKS: Record<number, string> = {
  0: "Unranked",
  1: "Listener",
  2: "First Spin",
  3: "Crate Digger",
  4: "Selector",
  5: "Legend",
};

/** Fully rated releases required to reach a level. */
export const ALBUMS_FOR_LEVEL: Record<number, number> = {
  0: 0,
  1: 5,
  2: 10,
  3: 15,
  4: 20,
  5: 25,
};

/** Written album reviews required to reach a level. */
export const REVIEWS_FOR_LEVEL: Record<number, number> = {
  0: 0,
  1: 0,
  2: 0,
  3: 0,
  4: 1,
  5: 2,
};

export const PERKS = [
  {
    id: "profile_cover",
    minLevel: 1,
    name: "Custom profile cover",
    summary: "Add a cover image to your profile page.",
    where: "Your profile page.",
    whereHref: "/profile",
    status: "coming_soon" as const,
  },
  {
    id: "profile_badge",
    minLevel: 2,
    name: "Custom profile badge",
    summary: "Choose which badge to show on your profile.",
    where: "Your profile page.",
    whereHref: "/profile",
    status: "coming_soon" as const,
  },
  {
    id: "avatar_border",
    minLevel: 3,
    name: "Avatar border",
    summary: "A custom frame around your profile photo, like Discord Nitro.",
    where: "Your profile photo.",
    whereHref: "/profile",
    status: "coming_soon" as const,
  },
  {
    id: "vinyl_player",
    minLevel: 4,
    name: "3D vinyl player",
    summary: "Pull the disc from the sleeve, drop it on the platter, and play.",
    where: "On any album page, in place of the current player.",
    whereHref: null,
    status: "coming_soon" as const,
  },
  {
    id: "beat_game",
    minLevel: 5,
    name: "Beat game",
    summary: "A short rhythm game locked to the album you are playing.",
    where: "From the album page while a track is playing.",
    whereHref: null,
    status: "coming_soon" as const,
  },
] as const;

export type Perk = (typeof PERKS)[number];
export type PerkId = Perk["id"];

export interface UserProgression {
  xp: number;
  level: number;
  fullyRatedCount: number;
  reviewCount: number;
}

export const EMPTY_PROGRESSION: UserProgression = {
  xp: 0,
  level: MIN_LEVEL,
  fullyRatedCount: 0,
  reviewCount: 0,
};

export function progressionFromRow(row: {
  xp?: number | null;
  level?: number | null;
  fully_rated_count?: number | null;
  review_count?: number | null;
}): UserProgression {
  const fullyRatedCount = Number(row.fully_rated_count) || 0;
  const reviewCount = Number(row.review_count) || 0;
  return {
    xp: Number(row.xp) || 0,
    level: levelFromProgress(fullyRatedCount, reviewCount),
    fullyRatedCount,
    reviewCount,
  };
}

export function xpForAlbumType(type: string | null | undefined): number {
  switch ((type ?? "Album").trim().toLowerCase()) {
    case "single":
      return XP_BY_ALBUM_TYPE.Single;
    case "ep":
      return XP_BY_ALBUM_TYPE.EP;
    case "compilation":
      return XP_BY_ALBUM_TYPE.Compilation;
    default:
      return XP_BY_ALBUM_TYPE.Album;
  }
}

export function clampLevel(level: number): number {
  if (!Number.isFinite(level)) return MIN_LEVEL;
  return Math.min(MAX_LEVEL, Math.max(MIN_LEVEL, Math.trunc(level)));
}

export function albumsForLevel(level: number): number {
  return ALBUMS_FOR_LEVEL[clampLevel(level)];
}

export function reviewsForLevel(level: number): number {
  return REVIEWS_FOR_LEVEL[clampLevel(level)];
}

/** Highest rank the user has earned from fully rated albums + written reviews. */
export function levelFromProgress(
  fullyRatedCount: number,
  reviewCount: number,
): number {
  const albums = Math.max(0, fullyRatedCount);
  const reviews = Math.max(0, reviewCount);
  if (albums >= ALBUMS_FOR_LEVEL[5] && reviews >= REVIEWS_FOR_LEVEL[5]) {
    return 5;
  }
  if (albums >= ALBUMS_FOR_LEVEL[4] && reviews >= REVIEWS_FOR_LEVEL[4]) {
    return 4;
  }
  if (albums >= ALBUMS_FOR_LEVEL[3]) return 3;
  if (albums >= ALBUMS_FOR_LEVEL[2]) return 2;
  if (albums >= ALBUMS_FOR_LEVEL[1]) return 1;
  return 0;
}

export function remainingToLevel(
  fullyRatedCount: number,
  reviewCount: number,
  level: number,
): { albums: number; reviews: number } {
  return {
    albums: Math.max(0, albumsForLevel(level) - Math.max(0, fullyRatedCount)),
    reviews: Math.max(0, reviewsForLevel(level) - Math.max(0, reviewCount)),
  };
}

export function rankForLevel(level: number): string {
  return RANKS[clampLevel(level)] ?? RANKS[MIN_LEVEL];
}

export function nextPerk(level: number) {
  return PERKS.find((perk) => perk.minLevel > level) ?? null;
}

export function unlockedPerks(level: number): Perk[] {
  return PERKS.filter((perk) => level >= perk.minLevel);
}

export function unlockedPerkIds(level: number): PerkId[] {
  return unlockedPerks(level).map((perk) => perk.id);
}

export function perksAtLevel(level: number): Perk[] {
  return PERKS.filter((perk) => perk.minLevel === level);
}

export interface RankLadderStep {
  level: number;
  rank: string;
  albumsFromPrevious: number;
  albumsFromStart: number;
  reviewsFromPrevious: number;
  reviewsFromStart: number;
  perks: Perk[];
}

/** Fully rated albums needed to go from `level - 1` to `level`. */
export function albumsFromPreviousLevel(level: number): number {
  const n = clampLevel(level);
  if (n <= MIN_LEVEL) return 0;
  return albumsForLevel(n) - albumsForLevel(n - 1);
}

export function reviewsFromPreviousLevel(level: number): number {
  const n = clampLevel(level);
  if (n <= MIN_LEVEL) return 0;
  return reviewsForLevel(n) - reviewsForLevel(n - 1);
}

/** Fully rated albums still needed from `count` to reach `level`. */
export function albumsToLevel(fullyRatedCount: number, level: number): number {
  return remainingToLevel(fullyRatedCount, 0, level).albums;
}

export function getRankLadder(): RankLadderStep[] {
  return Array.from({ length: MAX_LEVEL }, (_, index) => {
    const level = index + 1;
    return {
      level,
      rank: rankForLevel(level),
      albumsFromPrevious: albumsFromPreviousLevel(level),
      albumsFromStart: albumsForLevel(level),
      reviewsFromPrevious: reviewsFromPreviousLevel(level),
      reviewsFromStart: reviewsForLevel(level),
      perks: perksAtLevel(level),
    };
  });
}

function albumCountLabel(count: number): string {
  return count === 1 ? "1 album" : `${count} albums`;
}

function reviewCountLabel(count: number): string {
  return count === 1 ? "1 review" : `${count} reviews`;
}

function remainingParts(remaining: { albums: number; reviews: number }): string[] {
  const parts: string[] = [];
  if (remaining.albums > 0) parts.push(albumCountLabel(remaining.albums));
  if (remaining.reviews > 0) parts.push(reviewCountLabel(remaining.reviews));
  return parts;
}

export function formatRemainingToGoal(
  remaining: { albums: number; reviews: number },
  goal: string,
): string | null {
  const parts = remainingParts(remaining);
  if (parts.length === 0) return null;

  const actions: string[] = [];
  if (remaining.albums > 0) {
    actions.push(
      remaining.albums === 1
        ? "Rate 1 more album"
        : `Rate ${remaining.albums} more albums`,
    );
  }
  if (remaining.reviews > 0) {
    actions.push(
      remaining.reviews === 1
        ? "write 1 review"
        : `write ${remaining.reviews} reviews`,
    );
  }

  if (actions.length === 1) {
    const lead = actions[0];
    return `${lead[0].toUpperCase()}${lead.slice(1)} to ${goal}`;
  }

  return `${actions[0]} and ${actions[1]} to ${goal}`;
}

export function formatGoalShort(
  remaining: { albums: number; reviews: number },
  rank: string,
): string | null {
  const parts = remainingParts(remaining);
  if (parts.length === 0) return null;
  return `${parts.join(" and ")} to ${rank}`;
}

export function completingAlbumWouldReachLevel(
  fullyRatedCount: number,
  reviewCount: number,
  level: number,
): boolean {
  const after = remainingToLevel(fullyRatedCount + 1, reviewCount, level);
  return after.albums === 0 && after.reviews === 0;
}

export interface RatedAlbumForXp {
  totalTracks: number;
  ratedTrackIds: string[];
  albumType?: string | null;
}

export function xpFromRatedAlbums(albums: RatedAlbumForXp[]): {
  xp: number;
  fullyRatedCount: number;
} {
  let xp = 0;
  let fullyRatedCount = 0;
  for (const album of albums) {
    if (!isFullyRatedAlbum(album.ratedTrackIds.length, album.totalTracks)) {
      continue;
    }
    fullyRatedCount += 1;
    xp += xpForAlbumType(album.albumType);
  }
  return { xp, fullyRatedCount };
}

export interface IncompleteAlbumForXp {
  id: string;
  title: string;
  artistName: string;
  artworkUrl?: string;
  albumType?: string | null;
  totalTracks: number;
  ratedTrackIds: string[];
}

export interface IncompleteAlbumProgress {
  id: string;
  title: string;
  artistName: string;
  artworkUrl?: string;
  albumType?: string | null;
  ratedCount: number;
  totalTracks: number;
  remainingTracks: number;
  progressPercent: number;
  xpOnComplete: number;
}

export function incompleteAlbumsForProgress(
  albums: IncompleteAlbumForXp[],
  limit = 8,
): IncompleteAlbumProgress[] {
  return albums
    .filter(
      (album) =>
        album.totalTracks > 0 &&
        isPartiallyRatedAlbum(album.ratedTrackIds.length, album.totalTracks),
    )
    .map((album) => {
      const ratedCount = album.ratedTrackIds.length;
      const remainingTracks = Math.max(0, album.totalTracks - ratedCount);
      return {
        id: album.id,
        title: album.title,
        artistName: album.artistName,
        artworkUrl: album.artworkUrl,
        albumType: album.albumType,
        ratedCount,
        totalTracks: album.totalTracks,
        remainingTracks,
        progressPercent: Math.round((ratedCount / album.totalTracks) * 100),
        xpOnComplete: xpForAlbumType(album.albumType),
      };
    })
    .sort((a, b) => {
      if (a.remainingTracks !== b.remainingTracks) {
        return a.remainingTracks - b.remainingTracks;
      }
      return b.progressPercent - a.progressPercent;
    })
    .slice(0, limit);
}

export interface ProgressionView {
  xp: number;
  level: number;
  rank: string;
  fullyRatedCount: number;
  reviewCount: number;
  albumsIntoLevel: number;
  albumsForNextLevel: number;
  albumsToNextLevel: number;
  reviewsToNextLevel: number;
  progressPercent: number;
  nextRank: string;
  nextLevel: number;
  isMaxLevel: boolean;
  isUnranked: boolean;
  nextPerk: Perk | null;
  stepAlbums: number;
  stepAlbumsDone: number;
  hint: string | null;
  goalShort: string | null;
  nextPerkHint: string | null;
}

export function getProgressionView(
  fullyRatedCount: number,
  reviewCount = 0,
  xp = 0,
): ProgressionView {
  const albums = Math.max(0, fullyRatedCount);
  const reviews = Math.max(0, reviewCount);
  const level = levelFromProgress(albums, reviews);
  const rank = rankForLevel(level);
  const isMaxLevel = level >= MAX_LEVEL;
  const isUnranked = level <= MIN_LEVEL;
  const nextLevel = isMaxLevel ? MAX_LEVEL : level + 1;
  const nextRank = rankForLevel(nextLevel);
  const remaining = remainingToLevel(albums, reviews, nextLevel);
  const perk = nextPerk(level);

  const levelStart = albumsForLevel(level);
  const nextLevelStart = albumsForLevel(nextLevel);
  const albumsForNextLevel = Math.max(1, nextLevelStart - levelStart);
  const albumsIntoLevel = isMaxLevel
    ? albumsForNextLevel
    : Math.min(albumsForNextLevel, Math.max(0, albums - levelStart));
  const albumsToNextLevel = remaining.albums;
  const reviewsToNextLevel = remaining.reviews;
  const progressPercent = isMaxLevel
    ? 100
    : Math.min(100, Math.round((albumsIntoLevel / albumsForNextLevel) * 100));

  const hint = isMaxLevel
    ? null
    : formatRemainingToGoal(remaining, `reach ${nextRank}`);
  const goalShort = isMaxLevel
    ? null
    : formatGoalShort(remaining, nextRank);

  let nextPerkHint: string | null = null;
  if (perk) {
    nextPerkHint = formatRemainingToGoal(
      remainingToLevel(albums, reviews, perk.minLevel),
      `unlock ${perk.name}`,
    );
  }

  return {
    xp: Math.max(0, xp),
    level,
    rank,
    fullyRatedCount: albums,
    reviewCount: reviews,
    albumsIntoLevel,
    albumsForNextLevel,
    albumsToNextLevel,
    reviewsToNextLevel,
    progressPercent,
    nextRank,
    nextLevel,
    isMaxLevel,
    isUnranked,
    nextPerk: perk,
    stepAlbums: isMaxLevel ? 0 : albumsFromPreviousLevel(nextLevel),
    stepAlbumsDone: isMaxLevel ? 0 : albumsIntoLevel,
    hint,
    goalShort,
    nextPerkHint,
  };
}
