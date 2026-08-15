import AlbumCard from "@/components/album/AlbumCard";
import PlaylistCarousel from "@/components/home/PlaylistCarousel";
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
    <div className="border-t border-neutral-200/90 pt-10 first:border-t-0 first:pt-0">
      <h3 className="mb-5 text-lg font-semibold tracking-tight text-[#1d1d1d]">
        {section.genre.name}
      </h3>
      <PlaylistCarousel>
        {albums.map((album, index) => (
          <div
            key={album.id}
            className="w-[48%] shrink-0 snap-start sm:w-[32%] lg:w-[23%]"
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
