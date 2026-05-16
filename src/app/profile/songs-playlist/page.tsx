"use client";

import { useAuth } from "@/context/AuthContext";
import SongCollectionsSection from "@/components/profile/SongCollectionsSection";

export default function ProfileSongsPlaylistPage() {
  const { user } = useAuth();
  if (!user) return null;
  return <SongCollectionsSection userId={user.id} />;
}
