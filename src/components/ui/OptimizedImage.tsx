"use client";

import { useState, useCallback, useEffect } from "react";

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

  if (hasError) {
    if (fallbackSrc) {
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

  const imageStyles: React.CSSProperties = fill
    ? { position: "absolute", inset: 0, width: "100%", height: "100%" }
    : {};

  return (
    <img
      src={src}
      alt={alt}
      width={fill ? undefined : width}
      height={fill ? undefined : height}
      loading={priority ? "eager" : "lazy"}
      decoding="async"
      fetchPriority={priority ? "high" : undefined}
      onError={handleError}
      className={`bg-[#0a0a0d] ${className}`}
      style={imageStyles}
    />
  );
}
