import React from "react";
import Button from "@/components/ui/Button";

interface HeadingRowProps {
  title: string;
  badgeText?: string;
  seeAllHref?: string;
}

export default function HeadingRow({
  title,
  badgeText,
  seeAllHref,
}: HeadingRowProps) {
  return (
    <div className="mb-5 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <h2 className="text-2xl font-semibold tracking-tight text-[#1d1d1d]">
          {title}
        </h2>
        {badgeText && (
          <span className="rounded bg-neutral-800 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-white">
            {badgeText}
          </span>
        )}
      </div>

      {seeAllHref && (
        <Button href={seeAllHref} size="sm" variant="secondary">
          See all
        </Button>
      )}
    </div>
  );
}
