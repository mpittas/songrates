import type { ReactNode } from "react";
import { LuDisc3, LuHeart, LuStar } from "react-icons/lu";
import { PAGE_CONTAINER } from "@/lib/pageLayout";
import { cn } from "@/lib/utils";

export const AUTH_INPUT_CLASS =
  "h-12 w-full rounded-xl border border-line-strong bg-surface px-4 text-sm text-ink placeholder:text-ink-3 focus:border-ink/40";

/** A record sleeve beside the form keeps account flows in the music library. */
export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <main className="flex flex-1 bg-canvas text-ink">
      <div className={cn(PAGE_CONTAINER, "grid items-center gap-10 py-10 sm:py-14 lg:min-h-[calc(100svh-var(--header-h))] lg:grid-cols-2 lg:gap-16")}>
        <aside className="relative hidden min-h-[620px] flex-col justify-between overflow-hidden rounded-3xl bg-ink p-10 text-white lg:flex">
          <div className="relative z-10">
            <p className="eyebrow text-white/55">Your music, track by track</p>
            <h2 className="mt-5 max-w-xs font-display text-5xl leading-[1.02] font-semibold tracking-[-0.05em]">Good music.<br />Your call.</h2>
            <p className="mt-5 max-w-[260px] text-sm leading-6 text-white/60">Keep the records you love and give every track a score.</p>
          </div>
          <div aria-hidden className="absolute -right-24 bottom-20 size-[400px] rounded-full border border-white/10 bg-[repeating-radial-gradient(circle_at_center,#151413_0px,#151413_3px,#292623_4px,#151413_5px)] shadow-[0_20px_60px_rgb(0_0_0/0.5)]">
            <div className="absolute inset-[32%] flex items-center justify-center rounded-full bg-accent">
              <div className="absolute inset-3 rounded-full border border-black/15" />
              <LuDisc3 size={36} className="text-ink" />
            </div>
          </div>
          <div className="relative z-10 flex gap-5 border-t border-white/15 pt-5 text-xs text-white/65">
            <span className="flex items-center gap-2"><LuStar size={14} aria-hidden /> Rate tracks</span>
            <span className="flex items-center gap-2"><LuHeart size={14} aria-hidden /> Save favourites</span>
          </div>
        </aside>
        <div className="mx-auto w-full max-w-[420px]">{children}</div>
      </div>
    </main>
  );
}
