import { PAGE_CONTAINER } from "@/lib/pageLayout";
import { cn } from "@/lib/utils";

import { MySectionProps } from "@/types/ui";

export default function MySection({
  children,
  className,
  container = true,
  id,
}: MySectionProps) {
  return (
    <section id={id} className={cn("relative w-full", className)}>
      {container ? <div className={PAGE_CONTAINER}>{children}</div> : children}
    </section>
  );
}
