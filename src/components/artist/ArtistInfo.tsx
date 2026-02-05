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
  artistId,
  artistName,
  data,
  disableFetch,
  className = "",
}: Props) {
  return (
    <div className={`flex flex-col gap-2 text-sm ${className}`}>
      {/* Artist Image & Name */}
      <div className="space-y-4">
        <div className="relative w-full aspect-square max-w-[100px]  mx-auto lg:mx-0">
          {data.image ? (
            <img
              src={data.image}
              alt={artistName}
              className="w-full h-full object-cover rounded-full"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-white/5 border border-white/10 rounded-full lg:rounded-none">
              <span className="text-2xl font-mono text-white/20">
                {artistName.slice(0, 2).toUpperCase()}
              </span>
            </div>
          )}
        </div>

        <div className="text-center lg:text-left">
          <h1 className="text-lg text-white tracking-tight leading-tight">
            {artistName}
          </h1>
          {data.country && (
            <p className="text-xs text-neutral-500 font-mono uppercase tracking-wider">
              {data.country}
            </p>
          )}
        </div>
      </div>

      {/* Description */}
      {data.description && (
        <div className="text-neutral-400 text-xs line-clamp-6 hover:line-clamp-none transition-all duration-300">
          {data.description}
        </div>
      )}

      {/* Genres */}
      {data.genres && data.genres.length > 0 && (
        <div className="flex flex-wrap gap-2 justify-center lg:justify-start">
          {data.genres.slice(0, 5).map((genre) => (
            <span
              key={genre}
              className="px-2 py-1 bg-white/5 border border-white/5 text-[10px] text-neutral-400 hover:text-white hover:border-white/20 transition-colors uppercase tracking-wider"
            >
              {genre}
            </span>
          ))}
        </div>
      )}

      {/* Social Links */}
      <div className="flex flex-col gap-2.5 justify-center lg:justify-start pt-4 mt-2 border-t border-white/5 font-mono text-[10px] uppercase tracking-wider">
        {[
          {
            key: "officialSite",
            label: "Website",
            icon: FaGlobe,
            hover: "hover:text-cyan-400",
          },
          {
            key: "spotify",
            label: "Spotify",
            icon: FaSpotify,
            hover: "hover:text-[#1DB954]",
          },
          {
            key: "twitter",
            label: "Twitter",
            icon: FaTwitter,
            hover: "hover:text-[#1DA1F2]",
          },
          {
            key: "instagram",
            label: "Instagram",
            icon: FaInstagram,
            hover: "hover:text-[#E4405F]",
          },
          {
            key: "facebook",
            label: "Facebook",
            icon: FaFacebook,
            hover: "hover:text-[#1877F2]",
          },
          {
            key: "youtube",
            label: "YouTube",
            icon: FaYoutube,
            hover: "hover:text-[#FF0000]",
          },
          {
            key: "wikipedia",
            label: "Wikipedia",
            icon: FaWikipediaW,
            hover: "hover:text-white",
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
              className={`flex items-center gap-2 text-neutral-400 ${social.hover} transition-colors group`}
            >
              <Icon
                size={12}
                className="group-hover:scale-110 transition-transform"
              />
              <span>{social.label}</span>
            </a>
          );
        })}
      </div>

      {/* Dates */}
      {(data.beginDate || data.endDate) && (
        <div className="text-[10px] text-neutral-600 font-mono pt-2 border-t border-white/5 text-center lg:text-left">
          {data.beginDate && <span>Est. {data.beginDate.split("-")[0]}</span>}
          {data.endDate && <span> - {data.endDate.split("-")[0]}</span>}
        </div>
      )}
    </div>
  );
}
