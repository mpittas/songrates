import { FaCompass } from "react-icons/fa6";

import PageHero from "@/components/ui/PageHero";

export default function ExploreHero() {
  return (
    <PageHero
      eyebrow="Explore"
      title="Explore Music"
      subtitle="Charts, playlists, and genres."
      icon={<FaCompass size={30} />}
    />
  );
}
