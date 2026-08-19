import OptimizedImage from "@/components/ui/OptimizedImage";
import { cn } from "@/lib/utils";

export default function CoverTile({
  src,
  alt,
  className,
  priority = false,
}: {
  src?: string;
  alt: string;
  className?: string;
  priority?: boolean;
}) {
  return (
    <div className={cn("relative overflow-hidden bg-[#d8d8d8]", className)}>
      {src ? (
        <OptimizedImage
          src={src}
          alt={alt}
          fill
          className="object-cover"
          priority={priority}
          fallbackText="·"
        />
      ) : null}
    </div>
  );
}
