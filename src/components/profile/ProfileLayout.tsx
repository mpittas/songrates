/**
 * THESIS: The profile is a listening record, not a settings sidebar.
 * Identity sits on the crate; collections are tabs, not a left nav.
 * OWN-WORLD: Warm stone page, coral-dusk gradient banner,
 * circular avatar with a page-colored ring, large name, underline tabs.
 * STORY: You meet the listener, then scan their rated crate.
 * FIRST VIEWPORT: Full-bleed gradient; overlapping avatar + name; actions
 * on the right; tab strip; collection fills the rest.
 * FORM: Record Club identity/tabs + Spotify-scale name + dusk wash banner.
 */
import IdentityPageLayout from "@/components/layout/IdentityPageLayout";
import OptimizedImage from "@/components/ui/OptimizedImage";
import { FaUser } from "react-icons/fa";

interface ProfileLayoutProps {
  user: {
    username: string;
    displayName?: string | null;
    avatarUrl: string | null;
    subtitle?: React.ReactNode;
  };
  actions?: React.ReactNode;
  quickLinks?: React.ReactNode;
  children: React.ReactNode;
}

export default function ProfileLayout({
  user,
  actions,
  quickLinks,
  children,
}: ProfileLayoutProps) {
  const trimmedName = user.displayName?.trim() || "";
  const displayName =
    trimmedName && !trimmedName.includes("@") ? trimmedName : user.username;

  return (
    <IdentityPageLayout
      media={
        <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-full bg-neutral-200 ring-[3px] ring-[var(--background)] sm:h-28 sm:w-28">
          {user.avatarUrl ? (
            <OptimizedImage
              src={user.avatarUrl}
              alt={displayName}
              fill
              className="object-cover"
              fallbackSrc="/vinyl-placeholder.svg"
              priority
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-neutral-200 to-neutral-300">
              <FaUser size={32} className="text-neutral-500" />
            </div>
          )}
        </div>
      }
      title={displayName}
      subtitle={
        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
          <span className="font-medium text-neutral-700">@{user.username}</span>
          {user.subtitle ? (
            <>
              <span aria-hidden="true" className="text-neutral-300">
                ·
              </span>
              <span>{user.subtitle}</span>
            </>
          ) : null}
        </div>
      }
      actions={actions}
      nav={quickLinks}
    >
      {children}
    </IdentityPageLayout>
  );
}
