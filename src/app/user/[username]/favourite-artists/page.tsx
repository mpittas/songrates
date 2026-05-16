import LikedArtistsSection from "@/components/profile/LikedArtistsSection";
import { getUserProfile } from "@/lib/getUserProfile";

interface PageProps {
  params: Promise<{ username: string }>;
}

export default async function UserFavouriteArtistsPage({ params }: PageProps) {
  const { username } = await params;
  const profile = await getUserProfile(username);

  if (!profile) {
    return null;
  }

  return (
    <LikedArtistsSection
      userId={profile.id}
      isPrivate={!profile.show_favorites}
    />
  );
}
