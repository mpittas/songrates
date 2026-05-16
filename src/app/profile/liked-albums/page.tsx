"use client";

import { useAuth } from "@/context/AuthContext";
import LikedAlbumsSection from "@/components/profile/LikedAlbumsSection";

export default function ProfileLikedAlbumsPage() {
  const { user } = useAuth();
  if (!user) return null;
  return <LikedAlbumsSection userId={user.id} />;
}
