import Link from "next/link";
import { useEffect, useState } from "react";

interface Artist {
  id: string;
  name: string;
  country?: string;
  disambiguation?: string;
  type?: string;
  lifeSpan?: { begin?: string; end?: string };
}

export default function ArtistList({ artists }: { artists: Artist[] }) {
  const [images, setImages] = useState<Record<string, string>>({});

  useEffect(() => {
    if (artists.length === 0) return;

    const ids = artists.map((a) => a.id).join(",");
    fetch(`/api/images/artists?ids=${ids}`)
      .then((res) => res.json())
      .then((data) => {
        setImages((prev) => ({ ...prev, ...data.images }));
      })
      .catch((e) => console.error(e));
  }, [artists]);

  if (artists.length === 0) {
    return (
      <div className="text-center py-8 text-zinc-600">No artists found</div>
    );
  }

  return (
    <div className="divide-y divide-zinc-800">
      {artists.map((artist) => (
        <Link
          key={artist.id}
          href={`/artist/${artist.id}`}
          className="block group p-2 hover:bg-zinc-800 transition-colors"
        >
          <div className="flex justify-between items-center gap-2">
            {/* Image or Placeholder */}
            <div className="flex-shrink-0 w-8 h-8 overflow-hidden bg-zinc-800 border border-zinc-700">
              {images[artist.id] ? (
                <img
                  src={images[artist.id]}
                  alt={artist.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-zinc-600">
                  <span className="text-[10px] font-mono">
                    {artist.name.slice(0, 2).toUpperCase()}
                  </span>
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-bold text-zinc-100 group-hover:text-white transition-colors truncate">
                {artist.name}
              </h3>
              {artist.disambiguation && (
                <p className="text-[10px] text-zinc-500 truncate">
                  {artist.disambiguation}
                </p>
              )}
            </div>
            <div className="flex items-center gap-2 text-[10px] text-zinc-600 flex-shrink-0">
              {artist.type && (
                <span className="text-zinc-500">{artist.type}</span>
              )}
              <span>{artist.country || "—"}</span>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
