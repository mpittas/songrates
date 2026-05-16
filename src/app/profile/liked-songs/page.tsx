"use client";

import { useAuth } from "@/context/AuthContext";
import LikedSongsSection from "@/components/profile/LikedSongsSection";

export default function ProfileLikedSongsPage() {
  const { user } = useAuth();
  if (!user) return null;
  return <LikedSongsSection userId={user.id} />;
}
