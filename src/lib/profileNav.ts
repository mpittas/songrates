import type { IconType } from "react-icons";
import {
  FaStar,
  FaMusic,
  FaCompactDisc,
  FaMicrophoneAlt,
  FaLayerGroup,
  FaListUl,
} from "react-icons/fa";

export type ProfileNavSegment =
  | "rated"
  | "rated-songs"
  | "liked-songs"
  | "liked-albums"
  | "favourite-artists"
  | "songs-playlist"
  | "album-playlist";

export type ProfileNavItem = {
  segment: ProfileNavSegment;
  label: string;
  icon: IconType;
};

export const PROFILE_NAV_ITEMS: ProfileNavItem[] = [
  { segment: "rated", label: "Rated albums", icon: FaStar },
  { segment: "rated-songs", label: "Rated songs", icon: FaListUl },
  { segment: "liked-songs", label: "Liked songs", icon: FaMusic },
  { segment: "liked-albums", label: "Liked albums", icon: FaCompactDisc },
  {
    segment: "favourite-artists",
    label: "Favourite artists",
    icon: FaMicrophoneAlt,
  },
  { segment: "songs-playlist", label: "Songs Playlist", icon: FaLayerGroup },
  { segment: "album-playlist", label: "Album Playlist", icon: FaCompactDisc },
];

export function ownProfilePath(segment: ProfileNavSegment): string {
  return segment === "rated" ? "/profile/rated" : `/profile/${segment}`;
}

export function userProfilePath(
  username: string,
  segment: ProfileNavSegment,
): string {
  const base = `/user/${username}`;
  return segment === "rated" ? base : `${base}/${segment}`;
}

export function isProfileNavActive(
  pathname: string,
  href: string,
): boolean {
  if (pathname === href) return true;
  // Legacy standalone favourite-artists URL
  if (
    href === "/profile/favourite-artists" &&
    pathname === "/favourite-artists"
  ) {
    return true;
  }
  return false;
}
