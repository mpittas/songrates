import Link from "next/link";
import type { ReactNode } from "react";
import { FaCheck, FaMusic } from "react-icons/fa";
import { Playlist } from "@/types/playlist";
import Button from "./Button";

interface PlaylistRowProps {
  playlist: Playlist;
  isSelected: boolean;
  isAlreadyInPlaylist: boolean;
  showRemove: boolean;
  isConfirmingRemove: boolean;
  isRemoving: boolean;
  removeConfirmTitle: string;
  defaultIcon?: ReactNode;
  onToggleSelection: (playlistId: string) => void;
  onStartRemove: (playlistId: string) => void;
  onCancelRemove: () => void;
  onConfirmRemove: (playlistId: string) => void;
}

const truncateToChars = (text: string, maxChars: number) => {
  const s = (text || "").trim();
  if (s.length <= maxChars) return s;
  return `${s.slice(0, Math.max(0, maxChars - 1))}…`;
};

export default function PlaylistRow({
  playlist,
  isSelected,
  isAlreadyInPlaylist,
  showRemove,
  isConfirmingRemove,
  isRemoving,
  removeConfirmTitle,
  defaultIcon,
  onToggleSelection,
  onStartRemove,
  onCancelRemove,
  onConfirmRemove,
}: PlaylistRowProps) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => {
        if (isAlreadyInPlaylist) return;
        onToggleSelection(playlist.id);
      }}
      onKeyDown={(e) => {
        if (e.key !== "Enter" && e.key !== " ") return;
        e.preventDefault();
        if (isAlreadyInPlaylist) return;
        onToggleSelection(playlist.id);
      }}
      className={`relative w-full flex items-center gap-4 p-2 rounded-2xl transition-all duration-200
        ${
          isAlreadyInPlaylist
            ? "bg-neutral-100"
            : isSelected
              ? "bg-green-500/20"
              : "bg-neutral-200"
        }
      `}
    >
      <div
        className={`w-14 h-14 flex items-center justify-center rounded-xl transition-colors shrink-0
        ${
          isAlreadyInPlaylist
            ? "bg-neutral-200"
            : isSelected
              ? "bg-green-500/30"
              : "bg-white"
        }
      `}
      >
        <div
          className={
            isAlreadyInPlaylist
              ? "[&_svg]:text-neutral-600 transition-colors"
              : isSelected
                ? "[&_svg]:text-green-800 transition-colors"
                : "[&_svg]:text-neutral-800 transition-colors"
          }
        >
          {defaultIcon || <FaMusic size={18} />}
        </div>
      </div>

      <div className="flex-1 text-left min-w-0">
        <Link
          href={`/playlist/${playlist.id}`}
          target="_blank"
          rel="noreferrer"
          onClick={(e) => e.stopPropagation()}
          className={` text-md font-medium truncate transition-colors hover:underline ${
            isSelected ? "text-green-950" : "text-neutral-950"
          }`}
          aria-label={`Open playlist ${playlist.name} in new tab`}
        >
          {truncateToChars(playlist.name, 26)}
        </Link>
        {isAlreadyInPlaylist ? (
          <div className="absolute top-1/2 -translate-y-1/2 right-10 -mt-0.5">
            <span className="inline-flex items-center rounded-full bg-neutral-300 px-1.5 text-[11px] font-semibold tracking-wide text-neutral-800">
              Added
            </span>
          </div>
        ) : null}
      </div>

      <div
        className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all
        ${
          isAlreadyInPlaylist
            ? "bg-neutral-900 border-neutral-900 text-white"
            : isSelected
              ? "bg-green-500 border-green-500 text-white scale-110 shadow-sm"
              : "border-neutral-400"
        }
      `}
        role={showRemove ? "button" : undefined}
        tabIndex={showRemove ? 0 : undefined}
        onClick={(e) => {
          if (!showRemove) return;
          e.preventDefault();
          e.stopPropagation();
          onStartRemove(playlist.id);
        }}
      >
        {(isAlreadyInPlaylist || isSelected) && <FaCheck size={10} />}
      </div>

      {showRemove && isConfirmingRemove ? (
        <div
          className="absolute right-12 top-1/2 z-50 -translate-y-1/2"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="relative w-[220px] rounded-xl bg-neutral-800 p-3 text-white shadow-xl text-center">
            <div className="absolute left-full top-1/2 -translate-y-1/2 border-8 border-transparent border-l-neutral-800" />
            <div className="text-sm pb-2">{removeConfirmTitle}</div>
            <div className="mt-2 flex items-center justify-end gap-2">
              <Button type="button" variant="secondary" size="xs" onClick={onCancelRemove}>
                Cancel
              </Button>
              <Button
                type="button"
                disabled={isRemoving}
                variant="white"
                size="xs"
                onClick={() => onConfirmRemove(playlist.id)}
              >
                {isRemoving ? "Removing…" : "Yes, remove"}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
