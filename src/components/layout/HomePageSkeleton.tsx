import MySection from "@/components/ui/MySection";

export default function HomePageSkeleton() {
  return (
    <main className="relative flex min-h-screen flex-col bg-[#F2EFED] pb-14 text-neutral-900">
      <div className="h-64 w-full animate-pulse bg-[#8f1d28] sm:h-72" />

      <section className="py-12 sm:py-14">
        <MySection>
          <div className="w-full animate-pulse">
            <div className="flex items-end justify-between gap-4">
              <div className="h-6 w-44 rounded bg-neutral-900/10" />
              <div className="h-4 w-12 rounded bg-neutral-900/10" />
            </div>
            <div className="mt-6 flex flex-col gap-1.5 sm:gap-2">
              {Array.from({ length: 8 }).map((_, index) => (
                <div
                  key={index}
                  className="h-12 rounded-md border border-black/5 bg-white/60 sm:h-14"
                />
              ))}
            </div>
          </div>
        </MySection>
      </section>
    </main>
  );
}
