"use client";

import { useState, useCallback } from "react";
import { LazyLoadImage } from "react-lazy-load-image-component";
import "react-lazy-load-image-component/src/effects/blur.css";

interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  priority?: boolean;
  fallbackText?: string;
  onError?: () => void;
  fill?: boolean;
}

/**
 * Optimized image component using react-lazy-load-image-component
 * - Uses LazyLoadImage with blur effect for smooth loading
 * - Supports priority loading for above-the-fold images
 * - Error handling with fallback placeholder
 * - Uses native loading="eager" for priority images
 */
export default function OptimizedImage({
  src,
  alt,
  width,
  height,
  className = "",
  priority = false,
  fallbackText,
  onError,
  fill = false,
}: OptimizedImageProps) {
  const [hasError, setHasError] = useState(false);

  const handleError = useCallback(() => {
    setHasError(true);
    onError?.();
  }, [onError]);

  // Generate fallback initials from alt text
  const initials = fallbackText || alt.slice(0, 2).toUpperCase();

  // Placeholder color matching the theme
  const placeholderSrc =
    "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMSIgaGVpZ2h0PSIxIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9IiMwYTBhMGQiLz48L3N2Zz4=";

  if (hasError) {
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

  const imageStyles: React.CSSProperties = fill
    ? { position: "absolute", inset: 0, width: "100%", height: "100%" }
    : {};

  // For priority images, skip lazy loading
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
        style={imageStyles}
      />
    );
  }

  // For non-priority images, use LazyLoadImage with blur effect
  return (
    <LazyLoadImage
      src={src}
      alt={alt}
      width={fill ? "100%" : width}
      height={fill ? "100%" : height}
      effect="blur"
      placeholderSrc={placeholderSrc}
      onError={handleError}
      className={className}
      style={imageStyles}
      threshold={100}
      wrapperClassName={fill ? "absolute inset-0 w-full h-full" : undefined}
    />
  );
}
