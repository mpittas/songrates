import Link from "next/link";
import MySection from "@/components/MySection";

export default function Header() {
  return (
    <header className="border-b border-white/5 bg-[#050507]/40 backdrop-blur-sm sticky top-0 z-50 mx-auto w-full">
      <MySection className="py-0">
        <div className="flex h-12 items-center justify-between">
          <Link
            href="/"
            className="font-mono text-sm tracking-wide text-neutral-50 transition-colors hover:text-[#00f0ff]"
          >
            songrates_
          </Link>

          <nav className="flex items-center gap-8">
            <Link
              href="#"
              className="font-mono text-xs text-neutral-100 transition-colors hover:text-neutral-300"
            >
              charts
            </Link>
            <Link
              href="#"
              className="font-mono text-xs text-neutral-100 transition-colors hover:text-neutral-300"
            >
              lists
            </Link>
            <span className="h-3 w-px bg-neutral-100"></span>
            <Link
              href="#"
              className="font-mono text-xs text-neutral-100 transition-colors hover:text-neutral-300"
            >
              profile
            </Link>
          </nav>
        </div>
      </MySection>
    </header>
  );
}
