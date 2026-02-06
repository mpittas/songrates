"use client";

import { useState, useCallback, useEffect } from "react";
import { LazyLoadImage } from "react-lazy-load-image-component";
import "react-lazy-load-image-component/src/effects/blur.css";

import { OptimizedImageProps } from "@/types/ui";

/**
 * Optimized image component using react-lazy-load-image-component
 * - Blur-in effect for smooth perceived loading
 * - Priority images use native <img> with fetchPriority="high" (no lazy overhead)
 * - Low threshold triggers loading before images enter viewport
 * - Error handling with fallback placeholder
 */

const PLACEHOLDER_SRC =
  "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMSIgaGVpZ2h0PSIxIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9IiMwYTBhMGQiLz48L3N2Zz4=";

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

  // Reset error state when src changes
  useEffect(() => {
    setHasError(false);
  }, [src]);

  const handleError = useCallback(() => {
    setHasError(true);
    onError?.();
  }, [onError]);

  // Generate fallback initials from alt text
  const initials = fallbackText || alt.slice(0, 2).toUpperCase();

  if (hasError) {
    if (fallbackSrc) {
      // If fallbackSrc is provided, we try to show it.
      // We assume fallbackSrc is a local asset that exists.
      return (
        <div
          className={`flex items-center justify-center bg-[#0a0a0d] ${
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
        className={`flex items-center justify-center bg-[#0a0a0d] text-neutral-700 font-mono ${
          fill ? "absolute inset-0" : ""
        } ${className}`}
        style={!fill ? { width, height } : undefined}
      >
        <span className="text-xs">{initials}</span>
      </div>
    );
  }

  const fillStyles: React.CSSProperties = fill
    ? { position: "absolute", inset: 0, width: "100%", height: "100%" }
    : {};

  // Priority images: skip lazy loading entirely for instant above-the-fold rendering
  if (priority) {
    return (
      <img
        src={src}
        alt={alt}
        width={fill ? undefined : width}
        height={fill ? undefined : height}
        loading="eager"
        decoding="async"
        fetchPriority="high"
        onError={handleError}
        className={className}
        style={fillStyles}
      />
    );
  }

  // Non-priority images: lazy load with blur-in effect
  return (
    <LazyLoadImage
      src={src}
      alt={alt}
      width={fill ? "100%" : width}
      height={fill ? "100%" : height}
      effect="blur"
      placeholderSrc={PLACEHOLDER_SRC}
      onError={handleError}
      className={className}
      style={fillStyles}
      threshold={600}
      wrapperClassName={fill ? "absolute inset-0 w-full h-full" : undefined}
    />
  );
}
