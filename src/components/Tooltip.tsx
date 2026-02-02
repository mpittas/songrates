import React from "react";
import { TooltipProps } from "@/types/ui";

export default function Tooltip({ content, children }: TooltipProps) {
  if (!content) return <>{children}</>;

  return (
    <div className="relative group/tooltip inline-block">
      {children}
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover/tooltip:block z-50">
        <div className="bg-neutral-100 text-neutral-900 text-xs p-2 w-[200px] text-center">
          {content}
          {/* Arrow */}
          <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px border-4 border-transparent border-t-neutral-100"></div>
        </div>
      </div>
    </div>
  );
}
