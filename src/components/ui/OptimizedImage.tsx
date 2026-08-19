"use client";

import { useState, useCallback, useEffect } from "react";
import Image from "next/image";

import { artworkUrl } from "@/lib/appleMusic/api";
import { OptimizedImageProps } from "@/types/ui";

export default function OptimizedImage({
  src,
  alt,
  width,
  height,
  className = "",
  priority = false,
  fallbackText,
  fallbackSrc,
  onError,
  fill = false,
}: OptimizedImageProps) {
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setHasError(false);
  }, [src]);

  const handleError = useCallback(() => {
    setHasError(true);
    onError?.();
  }, [onError]);

  const initials = fallbackText || alt.slice(0, 2).toUpperCase();

  const resolvedSrc =
    src.includes("{w}") || src.includes("{h}")
      ? artworkUrl(src, width ?? height ?? 300)
      : src;

  if (hasError) {
    if (fallbackSrc) {
      return (
        <div
          className={`flex items-center justify-center bg-neutral-200 ${
            fill ? "absolute inset-0 w-full h-full" : ""
          } ${className}`}
          style={!fill ? { width, height } : undefined}
        >
          <img
            src={fallbackSrc}
            alt={alt}
            className="w-[60%] h-[60%] object-contain invert opacity-20"
          />
        </div>
      );
    }

    return (
      <div
        className={`flex items-center justify-center bg-neutral-200 text-neutral-500 ${
          fill ? "absolute inset-0" : ""
        } ${className}`}
        style={!fill ? { width, height } : undefined}
      >
        <span className="text-xs">{initials}</span>
      </div>
    );
  }

  const isAppleArtwork = resolvedSrc.includes("mzstatic.com");

  const imageStyles: React.CSSProperties = fill
    ? { position: "absolute", inset: 0, width: "100%", height: "100%" }
    : {};

  // next/image is used for fill-mode card/hero artwork. Fixed-size callers
  // (e.g. the player bar thumbnail) stay on native <img> — next/image at 40px
  // is unreliable and the optimizer adds little value at that size.
  const useNativeImg = !isAppleArtwork || !fill;

  if (useNativeImg) {
    return (
      <img
        src={resolvedSrc}
        alt={alt}
        width={fill ? undefined : width}
        height={fill ? undefined : height}
        loading={priority ? "eager" : "lazy"}
        decoding="async"
        fetchPriority={priority ? "high" : undefined}
        onError={handleError}
        className={`bg-neutral-200 ${className}`}
        style={imageStyles}
      />
    );
  }

  return (
    <Image
      src={resolvedSrc}
      alt={alt}
      fill
      priority={priority}
      onError={handleError}
      className={`bg-neutral-200 ${className}`}
      style={{ objectFit: "cover" }}
      sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
    />
  );
}

