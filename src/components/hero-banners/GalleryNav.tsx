import Link from "next/link";

const STUDIES = [
  { href: "#catalog-bloom", label: "Catalog Bloom" },
  { href: "#sleeve-disc", label: "Sleeve & Disc" },
  { href: "#listening-stack", label: "Listening Stack" },
  { href: "#cut-divide", label: "Cut Divide" },
  { href: "#cover-river", label: "Cover River" },
] as const;

export default function GalleryNav() {
  return (
    <nav
      aria-label="Hero studies"
      className="sticky top-0 z-40 border-b border-black/10 bg-[#f2efed]/92 backdrop-blur-md"
    >
      <div className="mx-auto flex max-w-[1180px] items-center gap-3 overflow-x-auto px-4 py-3 sm:px-6">
        <Link
          href="/"
          className="shrink-0 text-sm font-medium text-neutral-900 underline-offset-4 hover:underline"
        >
          Home
        </Link>
        <span className="shrink-0 text-neutral-300" aria-hidden>
          /
        </span>
        <ul className="flex min-w-0 items-center gap-1.5">
          {STUDIES.map((study) => (
            <li key={study.href}>
              <a
                href={study.href}
                className="inline-flex shrink-0 rounded-full border border-black/10 bg-white px-3 py-1.5 text-sm text-neutral-700 transition-colors hover:border-black/20 hover:text-neutral-950 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-900"
              >
                {study.label}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
}
