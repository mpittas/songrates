export default function ProfilePageSkeleton() {
  return (
    <main className="min-h-screen bg-[var(--background)]">
      <div className="h-44 animate-pulse bg-[#c13a62] sm:h-56 md:h-64" />
      <div className="mx-auto w-full max-w-[1180px] px-4 sm:px-6">
        <div className="-mt-12 flex items-end gap-4 sm:-mt-14">
          <div className="h-24 w-24 animate-pulse rounded-full bg-neutral-300 ring-[3px] ring-[var(--background)] sm:h-28 sm:w-28" />
          <div className="mb-2 space-y-2">
            <div className="h-8 w-40 animate-pulse rounded-md bg-neutral-300" />
            <div className="h-4 w-28 animate-pulse rounded-md bg-neutral-200" />
          </div>
        </div>
        <div className="mt-8 flex gap-3">
          {Array.from({ length: 5 }).map((_, index) => (
            <div
              key={index}
              className="h-8 w-20 animate-pulse rounded-full bg-neutral-200"
            />
          ))}
        </div>
        <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {Array.from({ length: 10 }).map((_, index) => (
            <div key={index} className="space-y-2">
              <div className="aspect-square animate-pulse rounded-md bg-neutral-200" />
              <div className="h-3 w-3/4 animate-pulse rounded bg-neutral-200" />
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
