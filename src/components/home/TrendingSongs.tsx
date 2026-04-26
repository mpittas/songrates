import { getTrendingSongs, artworkUrl } from "@/lib/appleMusic/api";
import SongRow from "@/main-components/SongRow";
import MySection from "@/components/ui/MySection";
import { formatTime } from "@/lib/utils";

export default async function TrendingSongs() {
  const songs = await getTrendingSongs(10);

  if (!songs || songs.length === 0) return null;

  return (
    <section className="py-12 sm:py-14">
      <MySection>
        <div className="w-full">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-3xl font-semibold tracking-tight text-[#1d1d1d]">
              Trending Songs
            </h2>
            <span className="rounded bg-black px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-white">
              Global Top 100
            </span>
          </div>

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
