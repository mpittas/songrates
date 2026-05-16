import OptimizedImage from "@/components/ui/OptimizedImage";
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
    avatarUrl: string | null;
    subtitle: React.ReactNode;
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
  return (
    <main className="min-h-screen bg-[#fafafa] pb-24">
      {/* Cover Art Banner */}
      <div className="relative w-full h-40 sm:h-44 md:h-48 overflow-hidden bg-neutral-900">
        <img
          src="/profile-cover.svg"
          alt=""
          className="w-full h-full object-cover opacity-80"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 -mt-16 relative z-10">
        <div className="flex flex-col lg:flex-row gap-16 ">
          {/* LEFT SIDEBAR */}
          <aside className="w-full lg:w-60 shrink-0">
            <div className="bg-white rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-neutral-100 p-3 flex flex-col gap-5 sticky top-8">
              {/* Avatar & User Info */}
              <div className="flex flex-col items-center text-center -mt-10">
                <div className="relative w-24 h-24 rounded-full overflow-hidden border-4 border-white shadow-lg bg-neutral-100 mb-3 shrink-0">
                  {user.avatarUrl ? (
                    <OptimizedImage
                      src={user.avatarUrl}
                      alt={user.username}
                      fill
                      className="object-cover"
                      fallbackSrc="/vinyl-placeholder.svg"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-neutral-100 to-neutral-200">
                      <FaUser size={36} className="text-neutral-400" />
                    </div>
                  )}
                </div>

                <h1 className="text-xl font-bold text-neutral-900 tracking-tight">
                  @{user.username}
                </h1>
                <div className="text-sm text-neutral-500 mt-1 font-medium flex items-center justify-center gap-1">
                  {user.subtitle}
                </div>
              </div>

              {quickLinks && (
                <>
                  <div className="w-full h-px bg-neutral-100" />
                  <nav className="flex flex-col gap-1.5">
                    <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-widest mb-3 px-3">
                      Quick Links
                    </h3>
                    {quickLinks}
                  </nav>
                </>
              )}

              {actions && (
                <>
                  <div className="w-full h-px bg-neutral-100 mt-auto" />
                  <div className="flex flex-col gap-2 w-full">{actions}</div>
                </>
              )}
            </div>
          </aside>

          {/* RIGHT CONTENT */}
          <div className="flex-1 flex flex-col gap-8 mt-4 lg:mt-26">
            {children}
          </div>
        </div>
      </div>
    </main>
  );
}
