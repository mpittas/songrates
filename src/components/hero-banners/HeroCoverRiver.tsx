import CoverRiverHero from "@/components/home/CoverRiverHero";
import HeroSearch from "@/components/hero-banners/HeroSearch";
import type { HeroTrack } from "@/components/hero-banners/types";

type HeroCoverRiverProps = {
  tracks: HeroTrack[];
};

export default function HeroCoverRiver({ tracks }: HeroCoverRiverProps) {
  return (
    <CoverRiverHero
      id="cover-river"
      tracks={tracks}
      search={<HeroSearch variant="river" />}
    />
  );
}
