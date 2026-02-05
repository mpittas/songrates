import { cn } from "@/lib/utils";
import { ReactNode } from "react";

import { MySectionProps } from "@/types/ui";

export default function MySection({
  children,
  className,
  container = true,
  id,
}: MySectionProps) {
  return (
    <section id={id} className={cn("relative w-full", className)}>
      {container ? (
        <div className="mx-auto w-full max-w-[900px] px-6">{children}</div>
      ) : (
        children
      )}
    </section>
  );
}
