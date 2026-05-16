"use client";

import { useAuth } from "@/context/AuthContext";
import LikedArtistsSection from "@/components/profile/LikedArtistsSection";

export default function ProfileFavouriteArtistsPage() {
  const { user } = useAuth();
  if (!user) return null;
  return <LikedArtistsSection userId={user.id} />;
}
