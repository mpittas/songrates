import Link from "next/link";

interface Artist {
  id: string;
  name: string;
  country?: string;
  lifeSpan?: { begin?: string; end?: string };
}

export default function ArtistList({ artists }: { artists: Artist[] }) {
  if (artists.length === 0) return null;

  return (
    <div className="w-full max-w-2xl mx-auto space-y-4">
      {artists.map((artist) => (
        <Link
          key={artist.id}
          href={`/artist/${artist.id}`}
          className="block group p-4 hover:bg-zinc-900/50 transition-colors border-b border-zinc-800"
        >
          <div className="flex justify-between items-baseline">
            <h3 className="text-xl font-light text-zinc-100 group-hover:text-white transition-colors">
              {artist.name}
            </h3>
            <span className="text-sm text-zinc-600 font-mono">
              {artist.country || "Unknown"}
            </span>
          </div>
        </Link>
      ))}
    </div>
  );
}
