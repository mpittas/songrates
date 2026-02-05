import { ArtistInfo as ArtistInfoType } from "@/types/music";
import {
  FaTwitter,
  FaFacebook,
  FaInstagram,
  FaYoutube,
  FaWikipediaW,
  FaSpotify,
  FaGlobe,
} from "react-icons/fa";

interface Props {
  artistId: string;
  artistName: string;
  data: ArtistInfoType;
  disableFetch?: boolean;
  className?: string;
}

export default function ArtistInfo({
  artistName,
  data,
  className = "",
}: Props) {
  return (
    <div className={`flex flex-col gap-6 text-sm ${className}`}>
      <div className="space-y-4">
        <div className="relative w-full aspect-square max-w-[100px] mx-auto lg:mx-0">
          {data.image ? (
            <img
              src={data.image}
              alt={artistName}
              className="w-full h-full object-cover rounded-full bg-neutral-900"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-white/5 rounded-full">
              <span className="text-xl font-mono text-white/10">
                {artistName.slice(0, 2).toUpperCase()}
              </span>
            </div>
          )}
        </div>

        <div className="text-center lg:text-left">
          <h1 className="text-xl text-white tracking-tight leading-tight mb-1">
            {artistName}
          </h1>
          {data.country && (
            <p className="text-[10px] text-neutral-600 font-mono uppercase tracking-widest">
              {data.country}
            </p>
          )}
        </div>
      </div>

      {data.description && (
        <div className="text-neutral-500 text-xs leading-relaxed line-clamp-6 hover:line-clamp-none transition-all duration-300">
          {data.description}
        </div>
      )}

      {data.genres && data.genres.length > 0 && (
        <div className="flex flex-wrap gap-1.5 justify-center lg:justify-start">
          {data.genres.slice(0, 5).map((genre) => (
            <span
              key={genre}
              className="px-2 py-0.5 bg-white/5 text-[9px] text-neutral-500 hover:text-neutral-300 transition-colors uppercase tracking-widest"
            >
              {genre}
            </span>
          ))}
        </div>
      )}

      <div className="flex flex-col gap-3 justify-center lg:justify-start pt-4 border-t border-white/5 font-mono text-[10px] uppercase tracking-widest">
        {[
          {
            key: "officialSite",
            label: "Website",
            icon: FaGlobe,
            color: "hover:text-cyan-400",
          },
          {
            key: "spotify",
            label: "Spotify",
            icon: FaSpotify,
            color: "hover:text-[#1DB954]",
          },
          {
            key: "twitter",
            label: "Twitter",
            icon: FaTwitter,
            color: "hover:text-[#1DA1F2]",
          },
          {
            key: "instagram",
            label: "Instagram",
            icon: FaInstagram,
            color: "hover:text-[#E4405F]",
          },
          {
            key: "facebook",
            label: "Facebook",
            icon: FaFacebook,
            color: "hover:text-[#1877F2]",
          },
          {
            key: "youtube",
            label: "YouTube",
            icon: FaYoutube,
            color: "hover:text-[#FF0000]",
          },
          {
            key: "wikipedia",
            label: "Wikipedia",
            icon: FaWikipediaW,
            color: "hover:text-white",
          },
        ].map((social) => {
          const url = data[social.key as keyof ArtistInfoType];
          if (!url || typeof url !== "string") return null;

          const Icon = social.icon;
          return (
            <a
              key={social.key}
              href={url}
              target="_blank"
              rel="noreferrer"
              className={`flex items-center gap-2 text-neutral-500 ${social.color} transition-colors group`}
            >
              <Icon
                size={12}
                className="group-hover:scale-110 transition-transform opacity-70 group-hover:opacity-100"
              />
              <span>{social.label}</span>
            </a>
          );
        })}
      </div>

      {(data.beginDate || data.endDate) && (
        <div className="text-[9px] text-neutral-700 font-mono pt-2 border-t border-white/5 text-center lg:text-left uppercase tracking-widest">
          {data.beginDate && <span>Est. {data.beginDate.split("-")[0]}</span>}
          {data.endDate && <span> - {data.endDate.split("-")[0]}</span>}
        </div>
      )}
    </div>
  );
}
