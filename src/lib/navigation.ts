/** Primary browse destinations, shared by the header, tab bar and footer. */
export const PRIMARY_NAV = [
  { href: "/explore", label: "Explore" },
  { href: "/moods", label: "Moods" },
  { href: "/genres", label: "Genres" },
] as const;

export function isNavActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}
