import RatedSongsSection from "@/components/profile/RatedSongsSection";
import { getUserProfile } from "@/lib/getUserProfile";

interface PageProps {
  params: Promise<{ username: string }>;
}

export default async function UserRatedSongsPage({ params }: PageProps) {
  const { username } = await params;
  const profile = await getUserProfile(username);

  if (!profile) {
    return null;
  }

  return (
    <RatedSongsSection
      userId={profile.id}
      isPrivate={!profile.show_favorites}
    />
  );
}
