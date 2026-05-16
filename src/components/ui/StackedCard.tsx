"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import OptimizedImage from "@/components/ui/OptimizedImage";

export interface StackedCardProps {
  title: string;
  itemCount: number;
  itemLabel?: string;
  href?: string;
  /** Up to 3 cover URLs: [front, middle, back] — front is the largest layer */
  coverUrls?: (string | undefined)[];
  className?: string;
}

function StackLayer({
  className,
  coverUrl,
  alt,
}: {
  className?: string;
  coverUrl?: string;
  alt: string;
}) {
  return (
    <div className={cn("relative overflow-hidden bg-[#e5e5e5]", className)}>
      {coverUrl ? (
        <OptimizedImage
          src={coverUrl}
          alt={alt}
          fill
          className="object-cover"
          fallbackText="·"
        />
      ) : null}
    </div>
  );
}

export default function StackedCard({
  title,
  itemCount,
  itemLabel = "items",
  href,
  coverUrls = [],
  className,
}: StackedCardProps) {
  const [front, middle, back] = coverUrls;
  const singular = itemLabel.endsWith("s") ? itemLabel.slice(0, -1) : itemLabel;
  const countLabel = `${itemCount} ${itemCount === 1 ? singular : itemLabel}`;

  const content = (
    <>
      <div className="mx-auto flex w-full flex-col items-center">
        {back ? (
          <StackLayer
            coverUrl={back}
            alt=""
            className="z-0 h-2 w-[70%] shrink-0 rounded-t-lg rounded-b-none bg-[#c4c4c4]"
          />
        ) : (
          <div className="z-0 h-2 w-[70%] shrink-0 rounded-t-lg rounded-b-none bg-[#c4c4c4]" />
        )}

        {middle ? (
          <StackLayer
            coverUrl={middle}
            alt=""
            className="z-[1] h-2 w-[85%] shrink-0 rounded-t-lg rounded-b-none bg-[#d6d6d6]"
          />
        ) : (
          <div className="z-[1] h-2 w-[85%] shrink-0 rounded-t-lg rounded-b-none bg-[#d6d6d6]" />
        )}

        <StackLayer
          coverUrl={front}
          alt={title}
          className="relative z-10 aspect-square w-full shrink-0 rounded-xl bg-[#e5e5e5]"
        />
      </div>

      <div className="mt-3 text-left">
        <h3 className="text-base font-bold text-neutral-900 truncate leading-tight">
          {title}
        </h3>
        <p className="mt-1 text-sm text-neutral-500">{countLabel}</p>
      </div>
    </>
  );

  const rootClassName = cn("block w-full", className);

  if (href) {
    return (
      <Link href={href} className={rootClassName}>
        {content}
      </Link>
    );
  }

  return <div className={rootClassName}>{content}</div>;
}
