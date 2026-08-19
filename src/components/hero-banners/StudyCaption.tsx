type StudyCaptionProps = {
  name: string;
  structure: string;
  inspiredBy: { label: string; href: string };
};

export default function StudyCaption({
  name,
  structure,
  inspiredBy,
}: StudyCaptionProps) {
  return (
    <div className="border-b border-white/10 bg-[#161616] px-4 py-4 sm:px-6">
      <div className="mx-auto flex max-w-[1180px] flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between sm:gap-8">
        <p className="text-sm font-medium text-white">{name}</p>
        <p className="max-w-2xl text-sm text-white/55">
          {structure}{" "}
          <a
            href={inspiredBy.href}
            target="_blank"
            rel="noreferrer"
            className="text-white/80 underline decoration-white/25 underline-offset-3 hover:text-white"
          >
            Inspired by {inspiredBy.label}
          </a>
        </p>
      </div>
    </div>
  );
}
