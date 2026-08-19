import { cache } from "react";
import { createPublicClient } from "@/utils/supabase/public";
import {
  EMPTY_PROGRESSION,
  progressionFromRow,
  type UserProgression,
} from "@/lib/profileProgression";

export interface UserProfile {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  created_at: string;
  is_public: boolean;
  show_favorites: boolean;
  show_playlists: boolean;
  progression: UserProgression;
}

export const getUserProfile = cache(async function getUserProfile(
  username: string,
): Promise<UserProfile | null> {
  const supabase = createPublicClient();

  const { data, error } = await supabase
    .from("profiles")
    .select(
      "id, username, display_name, avatar_url, created_at, is_public, show_favorites, show_playlists",
    )
    .eq("username", username)
    .single();

  if (error || !data) return null;

  const { data: progressionRow } = await supabase
    .from("user_progression")
    .select("xp, level, fully_rated_count, review_count")
    .eq("user_id", data.id)
    .maybeSingle();

  return {
    id: data.id,
    username: data.username,
    display_name: data.display_name,
    avatar_url: data.avatar_url,
    created_at: data.created_at,
    is_public: data.is_public ?? true,
    show_favorites: data.show_favorites ?? true,
    show_playlists: data.show_playlists ?? true,
    progression: progressionRow
      ? progressionFromRow(progressionRow)
      : EMPTY_PROGRESSION,
  };
});
