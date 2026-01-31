import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface MySectionProps {
  children: ReactNode;
  className?: string;
  container?: boolean;
  id?: string;
}

export default function MySection({
  children,
  className,
  container = true,
  id,
}: MySectionProps) {
  return (
    <section id={id} className={cn("relative w-full", className)}>
      {container ? (
        <div className="mx-auto w-full max-w-[960px] px-6">{children}</div>
      ) : (
        children
      )}
    </section>
  );
}
