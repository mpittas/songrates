"use client";

import { useAuth } from "@/context/AuthContext";
import RatedSongsSection from "@/components/profile/RatedSongsSection";

export default function ProfileRatedSongsPage() {
  const { user } = useAuth();
  if (!user) return null;
  return <RatedSongsSection userId={user.id} editable />;
}
