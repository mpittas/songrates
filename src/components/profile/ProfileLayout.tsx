import OptimizedImage from "@/components/ui/OptimizedImage";
import { PAGE_CONTAINER } from "@/lib/pageLayout";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { LuUserRound } from "react-icons/lu";
import type { IconType } from "react-icons";

interface QuickLinkProps {
  icon: IconType;
  label: string;
  href: string;
  active?: boolean;
  onClick?: React.MouseEventHandler<HTMLAnchorElement>;
}

export function QuickLink({ icon: Icon, label, href, active, onClick }: QuickLinkProps) {
  return (
    <Link
      href={href}
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex shrink-0 items-center gap-2.5 rounded-full px-3.5 py-2.5 text-[13px] font-medium transition-colors lg:rounded-xl",
        active ? "bg-ink text-white" : "text-ink-2 hover:bg-ink/[0.05] hover:text-ink",
      )}
    >
      <Icon size={15} aria-hidden />
      <span className="whitespace-nowrap">{label}</span>
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

export default function ProfileLayout({ user, progression, actions, quickLinks, children }: ProfileLayoutProps) {
  const trimmedName = user.displayName?.trim() || "";
  const displayName = trimmedName && !trimmedName.includes("@") ? trimmedName : null;

  return (
    <main className="min-h-screen bg-canvas pb-16 text-ink">
      <div className={cn(PAGE_CONTAINER, "py-8 sm:py-12")}>
        <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:gap-10">
          <aside className="min-w-0 w-full shrink-0 lg:sticky lg:top-[calc(var(--header-h)+24px)] lg:w-60">
            <div className="rounded-2xl border border-line bg-surface p-5 shadow-card">
              <p className="eyebrow mb-5 text-ink-3">Listener profile</p>
              <div className="flex items-center gap-4 lg:flex-col lg:items-start">
                <div className="relative size-16 shrink-0 overflow-hidden rounded-full bg-subtle ring-1 ring-line lg:size-20">
                  {user.avatarUrl ? (
                    <OptimizedImage src={user.avatarUrl} alt={displayName || user.username} fill className="object-cover" fallbackSrc="/vinyl-placeholder.svg" priority />
                  ) : (
                    <div className="flex h-full items-center justify-center text-ink-3"><LuUserRound size={28} aria-hidden /></div>
                  )}
                </div>
                <div className="min-w-0 w-full">
                  <h1 className="wrap-anywhere font-display text-2xl font-semibold tracking-[-0.04em]">{displayName || `@${user.username}`}</h1>
                  {displayName ? <p className="mt-1 truncate text-sm text-ink-2">@{user.username}</p> : null}
                  {user.subtitle ? <div className="mt-2 text-xs leading-5 text-ink-3">{user.subtitle}</div> : null}
                </div>
              </div>
              {progression ? <div className="mt-5 border-t border-line pt-4">{progression}</div> : null}
              {actions ? <div className="mt-5 flex flex-wrap gap-2 border-t border-line pt-4">{actions}</div> : null}
            </div>
            {quickLinks ? (
              <nav aria-label="Music library" className="scrollbar-none -mx-4 mt-5 flex gap-1 overflow-x-auto px-4 sm:-mx-6 sm:px-6 lg:mx-0 lg:flex-col lg:overflow-visible lg:px-0">
                {quickLinks}
              </nav>
            ) : null}
          </aside>
          <div className="flex min-w-0 flex-1 flex-col gap-10 lg:pt-1">{children}</div>
        </div>
      </div>
    </main>
  );
}
