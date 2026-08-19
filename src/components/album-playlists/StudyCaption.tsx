export default function StudyCaption({
  name,
  structure,
  inspiredBy,
  tone = "dark",
}: {
  name: string;
  structure: string;
  inspiredBy: { label: string; href: string };
  tone?: "light" | "dark" | "steel" | "mist";
}) {
  const dark = tone === "dark";

  return (
    <div
      className={
        dark
          ? "border-t border-white/10 bg-[#111] px-4 py-4 sm:px-6"
          : tone === "steel"
            ? "border-t border-[#b8bcc8] bg-[#c9ccd6] px-4 py-4 sm:px-6"
            : tone === "mist"
              ? "border-t border-[#c9d4de] bg-[#e4edf4] px-4 py-4 sm:px-6"
              : "border-t border-[#e4e4de] bg-[#efefe9] px-4 py-4 sm:px-6"
      }
    >
      <div className="mx-auto flex max-w-[1180px] flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between sm:gap-8">
        <p
          className={
            dark
              ? "text-sm font-medium text-white"
              : "text-sm font-medium text-[#161616]"
          }
        >
          {name}
        </p>
        <p
          className={
            dark
              ? "max-w-2xl text-sm text-white/55"
              : "max-w-2xl text-sm text-[#4a4a4a]"
          }
        >
          {structure}{" "}
          <a
            href={inspiredBy.href}
            target="_blank"
            rel="noreferrer"
            className={
              dark
                ? "text-white/80 underline decoration-white/25 underline-offset-3 hover:text-white"
                : "text-[#161616] underline decoration-current/25 underline-offset-3 hover:decoration-current"
            }
          >
            Inspired by {inspiredBy.label}
          </a>
        </p>
      </div>
    </div>
  );
}
