import LikedAlbumsSection from "@/components/profile/LikedAlbumsSection";
import { getUserProfile } from "@/lib/getUserProfile";

interface PageProps {
  params: Promise<{ username: string }>;
}

export default async function UserLikedAlbumsPage({ params }: PageProps) {
  const { username } = await params;
  const profile = await getUserProfile(username);

  if (!profile) {
    return null;
  }

  return (
    <LikedAlbumsSection
      userId={profile.id}
      isPrivate={!profile.show_favorites}
    />
  );
}
