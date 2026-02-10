import { createClient } from "@/utils/supabase/server";
import { notFound } from "next/navigation";
import UserProfileClient from "./UserProfileClient";

interface UserProfile {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  created_at: string;
  is_public: boolean;
  show_favorites: boolean;
  show_playlists: boolean;
}

async function getUserProfile(username: string): Promise<UserProfile | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("profiles")
    .select(
      "id, username, display_name, avatar_url, created_at, is_public, show_favorites, show_playlists",
    )
    .eq("username", username)
    .single();

  if (error || !data) return null;

  return {
    id: data.id,
    username: data.username,
    display_name: data.display_name,
    avatar_url: data.avatar_url,
    created_at: data.created_at,
    is_public: data.is_public ?? true,
    show_favorites: data.show_favorites ?? true,
    show_playlists: data.show_playlists ?? true,
  };
}

interface PageProps {
  params: Promise<{ username: string }>;
}

export default async function UserProfilePage({ params }: PageProps) {
  const { username } = await params;
  const profile = await getUserProfile(username);

  if (!profile || !profile.is_public) {
    notFound();
  }

  return <UserProfileClient profile={profile} />;
}
