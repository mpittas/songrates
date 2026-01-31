"use client";

import React, { useEffect, useRef } from "react";
import { MeshGradientConfig } from "./types";

interface MeshGradientProps {
  config: MeshGradientConfig;
  className?: string;
}

const VERTEX_SHADER = `
attribute vec2 position;
void main() {
    gl_Position = vec4(position, 0.0, 1.0);
}
`;

const FRAGMENT_SHADER = `
precision highp float;

uniform vec2 u_resolution;
uniform float u_time;

// Dynamic uniforms from config
uniform float u_speed;
uniform float u_zoom;
uniform float u_amplitude;
uniform float u_contrast_boost;
uniform float u_noise;
uniform vec3 u_color1;
uniform vec3 u_color2;

// Random function
float random(in vec2 st) {
    return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
}

// Film grain noise function
float grain(vec2 st, float t) {
    return fract(sin(dot(st + t, vec2(12.9898, 78.233))) * 43758.5453);
}

// Noise function with smooth interpolation
float noise(in vec2 st) {
    vec2 i = floor(st);
    vec2 f = fract(st);

    // Cubic Hermite Spline
    vec2 u = f * f * (3.0 - 2.0 * f);

    return mix(mix(random(i + vec2(0.0, 0.0)),
                   random(i + vec2(1.0, 0.0)), u.x),
               mix(random(i + vec2(0.0, 1.0)),
                   random(i + vec2(1.0, 1.0)), u.x), u.y);
}

void main() {
    vec2 st = gl_FragCoord.xy / u_resolution.xy;
    vec2 uv = st; // Keep original UV for noise
    st.x *= u_resolution.x / u_resolution.y;

    // Control Zoom Level
    st *= u_zoom;

    // Control Animation Speed
    float t = u_time * u_speed;
    
    // Create a faster time variable for internal turbulence
    float t_fast = t * 1.5;

    // 1. Large Scale Flow (Sine Waves)
    // Increased magnitude for more obvious "swaying"
    vec2 waveOffset = vec2(sin(st.y * 4.0 + t), cos(st.x * 4.0 + t)) * 0.2;
    st += waveOffset;

    // 2. Global Rotation
    // Rotates the entire field
    float angle = t * 0.15;
    mat2 rot = mat2(cos(angle), -sin(angle), sin(angle), cos(angle));
    st = rot * st;

    // 3. Deep Domain Warping
    vec2 q = vec2(0.);
    q.x = noise(st + vec2(0.0, t_fast * 0.2)); 
    q.y = noise(st + vec2(1.0, t_fast * 0.25));

    vec2 r = vec2(0.);
    // Aggressive amplitude for "oily" look
    r.x = noise(st + u_amplitude * q + vec2(1.7, 9.2) + 0.5 * t_fast);
    r.y = noise(st + u_amplitude * q + vec2(8.3, 2.8) + 0.4 * t_fast);

    float f = noise(st + r);

    // 4. Color Palette - Using configurable colors
    // Dark black base (color2)
    vec3 colorBase = u_color2;
    
    // Main color (color1 - deep blue) - slightly boosted for glow
    vec3 colorMid = u_color1 * 1.15;
    
    // Glow highlight: Brighter, more saturated blue for glow effect
    vec3 colorGlow = u_color1 * 1.5 + vec3(0.1, 0.15, 0.3);
    
    // Soft highlight for edges
    vec3 colorHighlight = u_color1 * 1.3 + vec3(0.15, 0.2, 0.35);

    // 5. Mixing Logic
    
    // Use power function to crunch the blacks (high contrast)
    float mixVal = pow(f, 2.0 / u_contrast_boost); 
    
    // Smooth transition from base to mid
    float baseMix = smoothstep(0.15, 0.55, mixVal);
    vec3 color = mix(colorBase, colorMid, baseMix);

    // Add glow effect - intensity based on blue areas
    float glowIntensity = smoothstep(0.3, 0.7, baseMix) * 0.4;
    color += colorGlow * glowIntensity * mixVal;

    // Sharp Highlights with glow
    float rLen = length(r);
    float highlightIntensity = smoothstep(0.6, 0.9, rLen * mixVal * u_amplitude);
    color = mix(color, colorHighlight, highlightIntensity * 0.6);

    // Additional soft glow bloom on bright areas
    float bloom = smoothstep(0.5, 1.0, mixVal) * 0.15;
    color += u_color1 * bloom;

    // 6. Post-processing
    // Subtle vignette
    color *= 1.0 - (0.2 * (1.0 - mixVal));

    // 7. Film grain noise effect
    float grainValue = grain(gl_FragCoord.xy, u_time * 0.5);
    // Apply grain more visibly in mid-tones, less in pure black
    float grainMask = smoothstep(0.0, 0.3, baseMix) * smoothstep(1.0, 0.5, baseMix);
    color += (grainValue - 0.5) * u_noise * (0.5 + grainMask);

    gl_FragColor = vec4(color, 1.0);
}
`;

const MeshGradient: React.FC<MeshGradientProps> = ({ config, className }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const configRef = useRef(config);

  // Keep config ref updated
  configRef.current = config;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext("webgl");
    if (!gl) {
      console.error("WebGL not supported");
      return;
    }

    const createShader = (
      gl: WebGLRenderingContext,
      type: number,
      source: string,
    ) => {
      const shader = gl.createShader(type);
      if (!shader) return null;
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error("Shader compile error:", gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
      }
      return shader;
    };

    const vertexShader = createShader(gl, gl.VERTEX_SHADER, VERTEX_SHADER);
    const fragmentShader = createShader(
      gl,
      gl.FRAGMENT_SHADER,
      FRAGMENT_SHADER,
    );

    if (!vertexShader || !fragmentShader) {
      return;
    }

    const program = gl.createProgram();
    if (!program) {
      return;
    }

    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error("Program link error:", gl.getProgramInfoLog(program));
      return;
    }

    gl.useProgram(program);

    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    const positions = [
      -1.0, -1.0, 1.0, -1.0, -1.0, 1.0, -1.0, 1.0, 1.0, -1.0, 1.0, 1.0,
    ];
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

    const positionAttributeLocation = gl.getAttribLocation(program, "position");
    gl.enableVertexAttribArray(positionAttributeLocation);
    gl.vertexAttribPointer(positionAttributeLocation, 2, gl.FLOAT, false, 0, 0);

    // Helper function to convert hex color to RGB values (0-1 range)
    // Supports 6-digit (#RRGGBB) and 8-digit (#RRGGBBAA) formats
    const hexToRgb = (hex: string): [number, number, number] => {
      const result =
        /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})?$/i.exec(hex);
      if (result) {
        return [
          parseInt(result[1], 16) / 255,
          parseInt(result[2], 16) / 255,
          parseInt(result[3], 16) / 255,
        ];
      }
      return [0, 0, 0];
    };

    // Get Uniform Locations
    const resolutionLocation = gl.getUniformLocation(program, "u_resolution");
    const timeLocation = gl.getUniformLocation(program, "u_time");
    const speedLocation = gl.getUniformLocation(program, "u_speed");
    const zoomLocation = gl.getUniformLocation(program, "u_zoom");
    const amplitudeLocation = gl.getUniformLocation(program, "u_amplitude");
    const contrastLocation = gl.getUniformLocation(program, "u_contrast_boost");
    const noiseLocation = gl.getUniformLocation(program, "u_noise");
    const color1Location = gl.getUniformLocation(program, "u_color1");
    const color2Location = gl.getUniformLocation(program, "u_color2");

    let animationFrameId: number;
    const startTime = Date.now();

    const render = () => {
      const displayWidth = canvas.clientWidth;
      const displayHeight = canvas.clientHeight;

      if (canvas.width !== displayWidth || canvas.height !== displayHeight) {
        canvas.width = displayWidth;
        canvas.height = displayHeight;
        gl.viewport(0, 0, canvas.width, canvas.height);
      }

      gl.uniform2f(resolutionLocation, canvas.width, canvas.height);
      gl.uniform1f(timeLocation, (Date.now() - startTime) * 0.001);

      // Update Uniforms from config ref
      gl.uniform1f(speedLocation, configRef.current.speed);
      gl.uniform1f(zoomLocation, configRef.current.zoom);
      gl.uniform1f(amplitudeLocation, configRef.current.amplitude);
      gl.uniform1f(contrastLocation, configRef.current.contrast);
      gl.uniform1f(noiseLocation, configRef.current.noise);

      // Update color uniforms
      const color1Rgb = hexToRgb(configRef.current.color1);
      const color2Rgb = hexToRgb(configRef.current.color2);
      gl.uniform3f(color1Location, color1Rgb[0], color1Rgb[1], color1Rgb[2]);
      gl.uniform3f(color2Location, color2Rgb[0], color2Rgb[1], color2Rgb[2]);

      gl.drawArrays(gl.TRIANGLES, 0, 6);

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      gl.deleteProgram(program);
      gl.deleteShader(vertexShader);
      gl.deleteShader(fragmentShader);
      gl.deleteBuffer(positionBuffer);
    };
  }, []);

  return (
    <canvas ref={canvasRef} className={`block w-full h-full ${className}`} />
  );
};

export default MeshGradient;
