import { PAGE_CONTENT_TOP } from "@/lib/pageLayout";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { FaArrowLeft } from "react-icons/fa";

export default function ApplePlaylistLoading() {
  return (
    <main className="min-h-screen bg-[#f0e5df]/30">
      <div
        className={cn(
          "mx-auto max-w-[1180px] px-4 sm:px-6 pb-24",
          PAGE_CONTENT_TOP,
        )}
      >
        <Link
          href="/"
          className="mb-8 inline-flex items-center gap-2 font-mono text-sm text-neutral-500 transition-colors hover:text-neutral-900"
        >
          <FaArrowLeft size={12} />
          Back to Home
        </Link>
        <div className="flex flex-col gap-8 sm:flex-row sm:items-start">
          <div className="mx-auto aspect-square w-full max-w-[280px] shrink-0 animate-pulse rounded-lg bg-neutral-200 sm:mx-0" />
          <div className="min-w-0 flex-1 space-y-4">
            <div className="h-10 max-w-md animate-pulse rounded bg-neutral-200" />
            <div className="h-5 w-48 animate-pulse rounded bg-neutral-200/80" />
            <div className="h-12 max-w-[200px] animate-pulse rounded-full bg-neutral-200" />
          </div>
        </div>
        <div className="mt-12 space-y-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="h-14 animate-pulse rounded-lg bg-white/80"
            />
          ))}
        </div>
      </div>
    </main>
  );
}
