"use client";

import { usePathname } from "next/navigation";
import { QuickLink } from "@/components/profile/ProfileLayout";
import {
  PROFILE_NAV_ITEMS,
  isProfileNavActive,
  ownProfilePath,
  userProfilePath,
  type ProfileNavSegment,
} from "@/lib/profileNav";

interface ProfileQuickLinksProps {
  mode: "own" | "user";
  username?: string;
}

export default function ProfileQuickLinks({
  mode,
  username,
}: ProfileQuickLinksProps) {
  const pathname = usePathname();

  const hrefFor = (segment: ProfileNavSegment) =>
    mode === "own"
      ? ownProfilePath(segment)
      : userProfilePath(username!, segment);

  return (
    <>
      {PROFILE_NAV_ITEMS.map((item) => {
        const href = hrefFor(item.segment);
        return (
          <QuickLink
            key={item.segment}
            icon={item.icon}
            label={item.label}
            href={href}
            active={isProfileNavActive(pathname, href)}
          />
        );
      })}
    </>
  );
}
