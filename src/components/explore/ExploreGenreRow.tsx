import AlbumCard from "@/components/album/AlbumCard";
import PlaylistCarousel from "@/components/home/PlaylistCarousel";
import SectionHeader from "@/components/ui/SectionHeader";
import { artworkUrl, type AppleExploreGenreSection } from "@/lib/appleMusic/api";
import { Album } from "@/types/music";

function albumToCard(album: {
  id: string;
  name: string;
  artistName: string;
  artworkUrl?: string;
  releaseDate?: string;
}): Album {
  return {
    id: album.id,
    title: album.name,
    artistName: album.artistName,
    artworkUrl: artworkUrl(album.artworkUrl, 300),
    releaseDate: album.releaseDate,
  };
}

export default function ExploreGenreRow({
  section,
}: {
  section: AppleExploreGenreSection;
}) {
  const albums = section.albums;

  if (albums.length === 0) return null;

  return (
    <div>
      <SectionHeader
        as="h3"
        title={section.genre.name}
        count={albums.length}
        size="sm"
      />
      <PlaylistCarousel>
        {albums.map((album, index) => (
          <div
            key={album.id}
            className="w-[44%] shrink-0 snap-start sm:w-[30%] md:w-[calc((100%_-_3*1.25rem)/4)] lg:w-[calc((100%_-_4*1.25rem)/5.4)]"
          >
            <AlbumCard
              album={albumToCard(album)}
              isPriority={index === 0}
              showRating={false}
              showOptionsMenu={false}
            />
          </div>
        ))}
      </PlaylistCarousel>
    </div>
  );
}
