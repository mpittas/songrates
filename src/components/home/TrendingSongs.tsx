import { getTrendingSongs, artworkUrl } from "@/lib/appleMusic/api";
import SongRow from "@/main-components/SongRow";
import MySection from "@/components/ui/MySection";
import { formatTime } from "@/lib/utils";
import HeadingRow from "@/main-components/HeadingRow";

export default async function TrendingSongs() {
  const songs = await getTrendingSongs(10);

  if (!songs || songs.length === 0) return null;

  return (
    <section className="py-12 sm:py-14">
      <MySection>
        <div className="w-full">
          <HeadingRow
            title="Trending Songs"
            badgeText="Global top 100"
          />

          <div className="flex flex-col gap-2">
            {songs.map((song, i) => (
              <SongRow
                key={song.id}
                index={i + 1}
                title={song.name}
                artist={song.artistName}
                album={song.albumName || "Unknown Album"}
                duration={formatTime(song.durationMs, "milliseconds")}
                artworkUrl={artworkUrl(song.artworkUrl, 80)}
                track={{
                  id: song.id,
                  title: song.name,
                  artistName: song.artistName,
                  artistId: song.artistId,
                  artists: song.artists,
                  albumId: song.albumId,
                  albumTitle: song.albumName,
                  albumImageUrl: artworkUrl(song.artworkUrl, 300),
                  length: song.durationMs,
                }}
                albumContext={
                  song.albumId
                    ? {
                        albumId: song.albumId,
                        title: song.albumName || "Unknown Album",
                        artistName: song.artistName,
                        totalTracks: 1,
                        artworkUrl: artworkUrl(song.artworkUrl, 300),
                        releaseDate: song.releaseDate,
                      }
                    : undefined
                }
              />
            ))}
          </div>
        </div>
      </MySection>
    </section>
  );
}
