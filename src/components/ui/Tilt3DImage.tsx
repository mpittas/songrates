"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
} from "react";

import OptimizedImage from "@/components/ui/OptimizedImage";

interface Tilt3DImageProps {
  src: string;
  alt: string;
  /** Max tilt in degrees on each axis. */
  maxTilt?: number;
  /** Hover scale factor. */
  scale?: number;
  /** Perspective in px (lower = more dramatic 3D). */
  perspective?: number;
  /** Show the moving glare/sheen overlay (Steam capsule style). */
  glare?: boolean;
  fallbackText?: string;
  fallbackSrc?: string;
  className?: string;
}

/**
 * Steam-style 3D tilt artwork.
 *
 * The image tilts toward the pointer using CSS 3D transforms with perspective,
 * scales up slightly on hover, and gets an elliptical glare that tracks the
 * cursor.
 *
 * Disabled on phones/tablets (only fires for `hover: hover` + `pointer: fine`
 * devices, i.e. mouse/trackpad) and when `prefers-reduced-motion` is set.
 */
export default function Tilt3DImage({
  src,
  alt,
  maxTilt = 10,
  scale = 1.04,
  perspective = 800,
  glare = true,
  fallbackText,
  fallbackSrc,
  className = "",
}: Tilt3DImageProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [transform, setTransform] = useState<string>("");
  const [glarePos, setGlarePos] = useState<{ x: number; y: number }>({
    x: 50,
    y: 50,
  });
  const [isHovering, setIsHovering] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  // Disable the effect on touch devices (phones/tablets). `hover: hover`
  // is only true for primary-pointer devices like a mouse/trackpad; touch
  // devices report `hover: none` even when a finger is down. Tablets that
  // later connect a Bluetooth/USB mouse flip to `hover: hover` + `pointer:
  // fine`, re-enabling the effect automatically.
  const [finePointer, setFinePointer] = useState(false);

  useEffect(() => {
    const motionMq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const pointerMq = window.matchMedia("(hover: hover) and (pointer: fine)");
    const update = () => {
      setReducedMotion(motionMq.matches);
      setFinePointer(pointerMq.matches);
    };
    update();
    motionMq.addEventListener("change", update);
    pointerMq.addEventListener("change", update);
    return () => {
      motionMq.removeEventListener("change", update);
      pointerMq.removeEventListener("change", update);
    };
  }, []);

  // Tilt is only active on fine-pointer (mouse/trackpad) devices that haven't
  // asked for reduced motion. On phones/tablets this is false → flat image.
  const canTilt = finePointer && !reducedMotion;

  const reset = useCallback(() => {
    setTransform("");
    setIsHovering(false);
  }, []);

  const handlePointerMove = useCallback(
    (e: ReactPointerEvent<HTMLDivElement>) => {
      if (!canTilt) return;
      // Extra guard: ignore touch/pen input even if the media query is stale.
      if (e.pointerType !== "mouse") return;
      const el = containerRef.current;
      if (!el) return;

      const rect = el.getBoundingClientRect();
      const px = (e.clientX - rect.left) / rect.width; // 0..1
      const py = (e.clientY - rect.top) / rect.height; // 0..1

      // Rotate so the surface points toward the cursor.
      const rotateY = (px - 0.5) * 2 * maxTilt;
      const rotateX = -(py - 0.5) * 2 * maxTilt;

      setTransform(
        `perspective(${perspective}px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) scale(${scale})`,
      );
      setGlarePos({ x: px * 100, y: py * 100 });
      setIsHovering(true);
    },
    [maxTilt, perspective, scale, canTilt],
  );

  const containerStyle: CSSProperties = {
    transform: transform || undefined,
    transformStyle: "preserve-3d",
    transition: isHovering
      ? "transform 80ms ease-out, box-shadow 350ms ease-out"
      : "transform 400ms cubic-bezier(0.22, 1, 0.36, 1), box-shadow 400ms ease-out",
    willChange: "transform",
    boxShadow:
      isHovering && canTilt
        ? "0 18px 40px -12px rgba(0,0,0,0.45), 0 6px 14px -8px rgba(0,0,0,0.3)"
        : "0 0 0 0 rgba(0,0,0,0)",
  };

  return (
    <div
      ref={containerRef}
      onPointerMove={handlePointerMove}
      onPointerLeave={reset}
      onPointerCancel={reset}
      className={`relative h-full w-full rounded-xl ${className}`}
      style={containerStyle}
    >
      <div className="relative h-full w-full overflow-hidden rounded-xl transform-[translateZ(0)]">
        <OptimizedImage
          src={src}
          alt={alt}
          fill
          className="rounded-xl object-cover"
          priority
          fallbackText={fallbackText}
          fallbackSrc={fallbackSrc}
        />

        {glare && isHovering && canTilt ? (
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 rounded-xl mix-blend-overlay"
            style={{
              background: `radial-gradient(ellipse 75% 60% at ${glarePos.x}% ${glarePos.y}%, rgba(255,255,255,0.5) 0%, rgba(255,255,255,0.15) 38%, rgba(255,255,255,0) 70%)`,
            }}
          />
        ) : null}
      </div>
    </div>
  );
}
