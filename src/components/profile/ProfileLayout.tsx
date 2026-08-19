import OptimizedImage from "@/components/ui/OptimizedImage";
import { PAGE_CONTAINER } from "@/lib/pageLayout";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { FaUser, FaChevronRight } from "react-icons/fa";
import type { IconType } from "react-icons";

interface QuickLinkProps {
  icon: IconType;
  label: string;
  href: string;
  active?: boolean;
  onClick?: React.MouseEventHandler<HTMLAnchorElement>;
}

export function QuickLink({
  icon: Icon,
  label,
  href,
  active,
  onClick,
}: QuickLinkProps) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={`group flex items-center gap-2.5 px-3 py-2.5 rounded-lg transition-all duration-200 font-semibold text-sm ${
        active
          ? "bg-neutral-900 text-white shadow-md"
          : "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900"
      }`}
    >
      <Icon
        size={16}
        className={
          active
            ? "text-white"
            : "text-neutral-400 group-hover:text-neutral-600"
        }
      />
      <span className="flex-1">{label}</span>
      {!active && (
        <FaChevronRight
          size={12}
          className="text-neutral-300 opacity-0 group-hover:opacity-100 transition-opacity"
        />
      )}
    </Link>
  );
}

interface ProfileLayoutProps {
  user: {
    username: string;
    displayName?: string | null;
    avatarUrl: string | null;
    subtitle?: React.ReactNode;
  };
  progression?: React.ReactNode;
  actions?: React.ReactNode;
  quickLinks?: React.ReactNode;
  children: React.ReactNode;
}

export default function ProfileLayout({
  user,
  progression,
  actions,
  quickLinks,
  children,
}: ProfileLayoutProps) {
  const trimmedName = user.displayName?.trim() || "";
  const displayName =
    trimmedName && !trimmedName.includes("@") ? trimmedName : null;

  return (
    <main className="min-h-screen bg-stone-100 pb-24">
      <div className="relative h-40 w-full overflow-hidden bg-neutral-900 sm:h-44 md:h-48">
        <img
          src="/profile-cover.svg"
          alt=""
          className="h-full w-full object-cover opacity-80"
        />
        <div className="absolute inset-0 bg-linear-to-t from-black/60 via-black/20 to-transparent" />
      </div>

      <div className={cn(PAGE_CONTAINER, "relative z-10 -mt-16")}>
        <div className="flex flex-col gap-14 lg:flex-row">
          <aside className="w-full shrink-0 lg:w-60">
            <div className="sticky top-12 flex flex-col gap-5 rounded-xl border border-neutral-100 bg-white p-4 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
              <div className="-mt-12 flex flex-col items-center text-center">
                <div className="relative mb-3 h-22 w-22 shrink-0 overflow-hidden rounded-full bg-neutral-100">
                  {user.avatarUrl ? (
                    <OptimizedImage
                      src={user.avatarUrl}
                      alt={displayName || user.username}
                      fill
                      className="object-cover"
                      fallbackSrc="/vinyl-placeholder.svg"
                      priority
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-linear-to-br from-neutral-100 to-neutral-200">
                      <FaUser size={36} className="text-neutral-400" />
                    </div>
                  )}
                </div>

                <h1 className="text-xl font-bold tracking-tight text-neutral-900">
                  {displayName ? displayName : `@${user.username}`}
                </h1>
                {displayName ? (
                  <p className="mt-1 text-sm font-medium text-neutral-500">
                    @{user.username}
                  </p>
                ) : null}
                {user.subtitle ? (
                  <div className="mt-1 w-full text-center text-sm font-medium text-neutral-500">
                    {user.subtitle}
                  </div>
                ) : null}
                {progression ? (
                  <div className="mt-3 flex w-full justify-center">{progression}</div>
                ) : null}
              </div>

              {quickLinks ? (
                <>
                  <div className="h-px w-full bg-neutral-100" />
                  <nav className="flex flex-col gap-1.5">
                    <h3 className="mb-3 px-3 text-xs font-bold tracking-widest text-neutral-400 uppercase">
                      Quick Links
                    </h3>
                    {quickLinks}
                  </nav>
                </>
              ) : null}

              {actions ? (
                <>
                  <div className="mt-auto h-px w-full bg-neutral-100" />
                  <div className="flex w-full flex-col gap-2">{actions}</div>
                </>
              ) : null}
            </div>
          </aside>

          <div className="mt-4 flex flex-1 flex-col gap-8 lg:mt-26">
            {children}
          </div>
        </div>
      </div>
    </main>
  );
}
