import Link from "next/link";

export default function Header() {
  return (
    <header className="border-b border-zinc-800 bg-black/50 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
        <Link
          href="/"
          className="text-lg font-bold tracking-tight lowercase text-zinc-100 hover:text-white transition-colors"
        >
          songrates
        </Link>

        <nav className="flex items-center gap-6">
          <Link
            href="#"
            className="text-sm text-zinc-400 hover:text-white transition-colors"
          >
            charts
          </Link>
          <Link
            href="#"
            className="text-sm text-zinc-400 hover:text-white transition-colors"
          >
            lists
          </Link>
          <Link
            href="#"
            className="text-sm text-zinc-400 hover:text-white transition-colors"
          >
            community
          </Link>
          <div className="w-px h-4 bg-zinc-800 mx-2"></div>
          <Link
            href="#"
            className="text-sm text-zinc-400 hover:text-white transition-colors"
          >
            profile
          </Link>
        </nav>
      </div>
    </header>
  );
}
