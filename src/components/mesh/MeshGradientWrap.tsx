"use client";

import MeshGradient from "./MeshGradient";
import { MeshGradientConfig } from "./types";

const defaultMeshGradientConfig: MeshGradientConfig = {
  speed: 0.4,
  zoom: 1.5,
  amplitude: 0.3,
  contrast: 1.1,
  noise: 0.1,
  color1: "#0b627cff", // Vibrant Blue
  color2: "#09123dff", // Deep Rich Navy
};

export default function MeshGradientPage() {
  return <MeshGradient config={defaultMeshGradientConfig} />;
}
