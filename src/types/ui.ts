import { ReactNode } from "react";

export interface TooltipProps {
  content: string;
  children: ReactNode;
  position?: "top" | "bottom" | "left" | "right";
}

export interface MySectionProps {
  children: ReactNode;
  className?: string;
  container?: boolean;
  id?: string;
}

export interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  fill?: boolean;
  className?: string;
  priority?: boolean;
  fallbackText?: string;
  fallbackSrc?: string;
  onError?: () => void;
}
