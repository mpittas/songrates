import OptimizedImage from "@/components/ui/OptimizedImage";
import Link from "next/link";
import { FaUser, FaChevronRight } from "react-icons/fa";

interface QuickLinkProps {
  icon: any;
  label: string;
  href: string;
  active?: boolean;
}

export function QuickLink({ icon: Icon, label, href, active }: QuickLinkProps) {
  return (
    <Link
      href={href}
      className={`group flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 font-semibold text-sm ${
        active
          ? "bg-neutral-900 text-white shadow-md"
          : "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900"
      }`}
    >
      <Icon size={16} className={active ? "text-white" : "text-neutral-400 group-hover:text-neutral-600"} />
      <span className="flex-1">{label}</span>
      {!active && <FaChevronRight size={12} className="text-neutral-300 opacity-0 group-hover:opacity-100 transition-opacity" />}
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
      <div className="relative w-full h-64 md:h-80 overflow-hidden bg-neutral-900">
        <img
          src="/profile-cover.svg"
          alt=""
          className="w-full h-full object-cover opacity-80"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-24 relative z-10">
        <div className="flex flex-col lg:flex-row gap-8">
          
          {/* LEFT SIDEBAR */}
          <aside className="w-full lg:w-80 shrink-0">
            <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-neutral-100 p-6 flex flex-col gap-6 sticky top-24">
              
              {/* Avatar & User Info */}
              <div className="flex flex-col items-center text-center -mt-16">
                <div className="relative w-32 h-32 rounded-full overflow-hidden border-4 border-white shadow-lg bg-neutral-100 mb-4 shrink-0">
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
                      <FaUser size={48} className="text-neutral-400" />
                    </div>
                  )}
                </div>
                
                <h1 className="text-2xl font-bold text-neutral-900 tracking-tight">
                  @{user.username}
                </h1>
                <div className="text-sm text-neutral-500 mt-1 font-medium flex items-center justify-center gap-1">
                  {user.subtitle}
                </div>
                
                {actions && (
                  <div className="flex gap-3 mt-6 w-full">
                    {actions}
                  </div>
                )}
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
            </div>
          </aside>

          {/* RIGHT CONTENT */}
          <div className="flex-1 flex flex-col gap-8 mt-4 lg:mt-32">
            {children}
          </div>
        </div>
      </div>
    </main>
  );
}
