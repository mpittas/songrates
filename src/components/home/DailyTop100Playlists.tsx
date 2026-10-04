import { getDailyTop100Playlists } from "@/lib/appleMusic/api";
import CardRail from "@/components/ui/CardRail";
import MySection from "@/components/ui/MySection";
import SectionHeader from "@/components/ui/SectionHeader";
import PlaylistCard from "@/main-components/PlaylistCard";

export default async function DailyTop100Playlists() {
  const playlists = await getDailyTop100Playlists("us", 12);

  if (!playlists || playlists.length === 0) return null;

  return (
    <MySection className="py-10 sm:py-14">
      <SectionHeader
        eyebrow="Updated daily"
        title="Top 100 around the world"
        description="What each country has on repeat, straight from Apple Music."
        href="/explore"
        linkLabel="Explore"
      />

      <CardRail columns={6}>
        {playlists.slice(0, 6).map((playlist, index) => (
          <PlaylistCard
            key={playlist.id}
            playlist={playlist}
            index={index}
            subtitle="Daily chart"
          />
        ))}
      </CardRail>
    </MySection>
  );
}
