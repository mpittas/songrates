"use client";

import { useAuth } from "@/context/AuthContext";
import AlbumCollectionsSection from "@/components/profile/AlbumCollectionsSection";

export default function ProfileAlbumPlaylistPage() {
  const { user } = useAuth();
  if (!user) return null;
  return <AlbumCollectionsSection userId={user.id} />;
}
