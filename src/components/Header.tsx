import Link from "next/link";

export default function Header() {
  return (
    <header className="border-b border-[#1a1a1f] bg-[#050507]/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-6 h-12 flex items-center justify-between">
        <Link
          href="/"
          className="font-mono text-sm tracking-wide text-neutral-400 hover:text-[#00f0ff] transition-colors"
        >
          songrates_
        </Link>

        <nav className="flex items-center gap-8">
          <Link
            href="#"
            className="font-mono text-xs text-neutral-500 hover:text-neutral-200 transition-colors"
          >
            charts
          </Link>
          <Link
            href="#"
            className="font-mono text-xs text-neutral-500 hover:text-neutral-200 transition-colors"
          >
            lists
          </Link>
          <span className="w-px h-3 bg-[#1a1a1f]"></span>
          <Link
            href="#"
            className="font-mono text-xs text-neutral-500 hover:text-neutral-200 transition-colors"
          >
            profile
          </Link>
        </nav>
      </div>
    </header>
  );
}
