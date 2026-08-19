import CoverTile from "@/components/album-playlists/CoverTile";
import { cn } from "@/lib/utils";

export default function CoverCollage({
  urls,
  alt,
  className,
  priority = false,
}: {
  urls: (string | undefined)[];
  alt: string;
  className?: string;
  priority?: boolean;
}) {
  const covers = urls.filter((url): url is string => Boolean(url)).slice(0, 4);

  if (covers.length <= 1) {
    return (
      <CoverTile
        src={covers[0]}
        alt={alt}
        className={className}
        priority={priority}
      />
    );
  }

  const cells = [...covers];
  while (cells.length < 4) cells.push("");

  return (
    <div className={cn("grid grid-cols-2 grid-rows-2 overflow-hidden", className)}>
      {cells.map((src, index) => (
        <CoverTile
          key={`${src}-${index}`}
          src={src || undefined}
          alt={index === 0 ? alt : ""}
          className="size-full"
          priority={priority && index === 0}
        />
      ))}
    </div>
  );
}
