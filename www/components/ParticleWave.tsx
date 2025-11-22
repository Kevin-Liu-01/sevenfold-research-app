"use client";

import { useEffect, useRef } from "react";

interface WaveStrip {
  x: number;
  z: number;
  baseZ: number;
  width: number;
  points: Array<{ y: number; baseY: number }>;
}

interface MousePosition {
  x: number;
  y: number;
}

interface RGB {
  r: number;
  g: number;
  b: number;
}

// Constants
const ACCENT_COLOR = "#e36414";
const CAMERA_Z = 600;
const MAX_WAVE_AMPLITUDE = 104; // 50 + 120 * 0.2 + 30
const MOUSE_INFLUENCE_RADIUS = 200;
const MOUSE_PULL_STRENGTH = 80;
const GRADIENT_RADIUS = 300;
const STRIP_DENSITY = 8; // pixels per strip
const POINTS_PER_STRIP = 30;
const HORIZONTAL_CONTOUR_LINES = 8;
const WAVE_PHASE_SPEED = 0.6;
const Z_ANIMATION_SPEED = 0.2;
const INTERPOLATION_SPEED_PULL = 0.15;
const INTERPOLATION_SPEED_RETURN = 0.08;

// Color constants
const LIME_GREEN: RGB = { r: 126, g: 217, b: 87 }; // #7ed957
const YELLOW: RGB = { r: 255, g: 189, b: 89 }; // #ffbd59

// Parse accent color to RGB
const parseColor = (hex: string): RGB => ({
  r: parseInt(hex.slice(1, 3), 16),
  g: parseInt(hex.slice(3, 5), 16),
  b: parseInt(hex.slice(5, 7), 16),
});

export default function ParticleWave() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number | undefined>(undefined);
  const stripsRef = useRef<WaveStrip[]>([]);
  const timeRef = useRef(0);
  const mouseRef = useRef<MousePosition | null>(null);
  const isHoveredRef = useRef(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const accentRGB = parseColor(ACCENT_COLOR);

    // Setup canvas with proper DPR scaling
    const resizeCanvas = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
    };

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    // Initialize wave strips
    const initStrips = () => {
      const width = canvas.getBoundingClientRect().width;
      const height = canvas.getBoundingClientRect().height;
      stripsRef.current = [];

      const padding = width * 0.3;
      const totalWidth = width + padding * 2;
      const startX = -padding;
      const stripCount = Math.floor(totalWidth / STRIP_DENSITY);
      const stripWidth = totalWidth / stripCount;

      const startY = MAX_WAVE_AMPLITUDE;
      const endY = height - MAX_WAVE_AMPLITUDE;
      const baseHeight = endY - startY;

      for (let i = 0; i < stripCount; i++) {
        const x = startX + (i / stripCount) * totalWidth;
        const depthVariation = Math.sin(i * 0.3) * 120;
        const z = depthVariation + (Math.random() * 40 - 20);

        const points: Array<{ y: number; baseY: number }> = [];
        for (let p = 0; p < POINTS_PER_STRIP; p++) {
          const py = startY + (p / (POINTS_PER_STRIP - 1)) * baseHeight;
          points.push({ y: py, baseY: py });
        }

        stripsRef.current.push({
          x,
          z,
          baseZ: z,
          width: stripWidth * 1.2,
          points,
        });
      }
    };

    initStrips();

    // 3D to 2D perspective projection
    const project3D = (x: number, z: number, width: number) => {
      const scale = CAMERA_Z / (CAMERA_Z - z);
      const centerX = width / 2;
      const projectedX = centerX + (x - centerX) * scale;
      return { x: projectedX, scale };
    };

    // Blend two colors
    const blendColors = (color1: RGB, color2: RGB, t: number): RGB => ({
      r: color1.r + (color2.r - color1.r) * t,
      g: color1.g + (color2.g - color1.g) * t,
      b: color1.b + (color2.b - color1.b) * t,
    });

    // Get color at distance from mouse for hover gradient
    const getHoverColor = (distance: number): RGB => {
      const normalized = Math.min(1, distance / GRADIENT_RADIUS);
      if (normalized < 0.5) {
        return blendColors(LIME_GREEN, YELLOW, normalized * 2);
      }
      return blendColors(YELLOW, accentRGB, (normalized - 0.5) * 2);
    };

    // Update strip positions with wave motion and mouse interaction
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const updateStrips = (width: number, _height: number) => {
      stripsRef.current.forEach((strip, stripIndex) => {
        const wavePhase = timeRef.current * WAVE_PHASE_SPEED + strip.x * 0.005;
        const waveAmplitude = 50 + Math.abs(strip.z) * 0.2;

        // Mouse interaction: pull strips toward camera
        if (mouseRef.current && isHoveredRef.current) {
          const projected = project3D(strip.x, strip.z, width);
          const stripX = projected.x;
          const stripCenterY = strip.points[Math.floor(strip.points.length / 2)].baseY;

          const dx = mouseRef.current.x - stripX;
          const dy = mouseRef.current.y - stripCenterY;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < MOUSE_INFLUENCE_RADIUS) {
            const influence = 1 - distance / MOUSE_INFLUENCE_RADIUS;
            const mouseInfluence = influence * influence;
            const targetZ = strip.baseZ - MOUSE_PULL_STRENGTH * mouseInfluence;
            strip.z += (targetZ - strip.z) * INTERPOLATION_SPEED_PULL;
          } else {
            strip.z += (strip.baseZ - strip.z) * INTERPOLATION_SPEED_RETURN;
          }
        } else {
          strip.z += (strip.baseZ - strip.z) * INTERPOLATION_SPEED_RETURN;
        }

        // Update wave motion for each point
        strip.points.forEach((point, pointIndex) => {
          const verticalWave = Math.sin(wavePhase + pointIndex * 0.2) * waveAmplitude;
          const horizontalWave = Math.cos(wavePhase * 0.8 + stripIndex * 0.1) * 30;

          let mouseWave = 0;
          if (mouseRef.current && isHoveredRef.current) {
            const projected = project3D(strip.x, strip.z, width);
            const stripX = projected.x;
            const dy = mouseRef.current.y - point.baseY;
            const distance = Math.sqrt(
              Math.pow(mouseRef.current.x - stripX, 2) + dy * dy
            );

            if (distance < MOUSE_INFLUENCE_RADIUS) {
              const influence = (1 - distance / MOUSE_INFLUENCE_RADIUS) * 0.4;
              mouseWave = -dy * influence * influence;
            }
          }

          point.y = point.baseY + verticalWave + horizontalWave + mouseWave;
        });

        // Subtle z animation
        strip.z += Math.sin(timeRef.current * Z_ANIMATION_SPEED + stripIndex * 0.05) * 0.5;
      });
    };

    // Create hover gradient
    const createHoverGradient = (
      ctx: CanvasRenderingContext2D,
      stripX: number,
      stripWidth: number,
      baseOpacity: number,
      mouseX: number
    ): CanvasGradient => {
      const gradient = ctx.createLinearGradient(
        stripX - stripWidth / 2,
        0,
        stripX + stripWidth / 2,
        0
      );

      const sampleCount = 30;
      for (let s = 0; s <= sampleCount; s++) {
        const t = s / sampleCount;
        const sampleX = stripX - stripWidth / 2 + stripWidth * t;
        const dx = Math.abs(mouseX - sampleX);
        const normalizedDistance = Math.min(1, dx / GRADIENT_RADIUS);

        const color = getHoverColor(dx);
        const opacity = baseOpacity * (0.8 + (1 - normalizedDistance) * 0.2);

        gradient.addColorStop(
          t,
          `rgba(${Math.round(color.r)}, ${Math.round(color.g)}, ${Math.round(color.b)}, ${opacity})`
        );
      }

      return gradient;
    };

    // Create default gradient
    const createDefaultGradient = (
      ctx: CanvasRenderingContext2D,
      stripX: number,
      stripWidth: number,
      baseOpacity: number,
      gradientPos: number
    ): CanvasGradient => {
      const gradient = ctx.createLinearGradient(
        stripX - stripWidth / 2,
        0,
        stripX + stripWidth / 2,
        0
      );

      const leftOpacity = baseOpacity * (1 - gradientPos * 0.5);
      const rightOpacity = baseOpacity * (0.3 + gradientPos * 0.2);

      gradient.addColorStop(0, `rgba(${accentRGB.r}, ${accentRGB.g}, ${accentRGB.b}, ${leftOpacity})`);
      gradient.addColorStop(0.5, `rgba(${accentRGB.r}, ${accentRGB.g}, ${accentRGB.b}, ${baseOpacity * 0.8})`);
      gradient.addColorStop(1, `rgba(${accentRGB.r}, ${accentRGB.g}, ${accentRGB.b}, ${rightOpacity})`);

      return gradient;
    };

    // Draw a single strip
    const drawStrip = (
      ctx: CanvasRenderingContext2D,
      strip: WaveStrip,
      width: number,
      height: number
    ) => {
      const projected = project3D(strip.x, strip.z, width);
      const stripX = projected.x;
      const scale = projected.scale;
      const stripWidth = strip.width * scale;

      // Cull strips outside viewport
      const margin = stripWidth;
      if (stripX + stripWidth / 2 < -margin || stripX - stripWidth / 2 > width + margin) {
        return;
      }

      // Calculate opacity
      const gradientPos = Math.max(0, Math.min(1, stripX / width));
      const gradientOpacity = Math.sin(gradientPos * Math.PI) * 0.6;
      const depthOpacity = 1 - Math.abs(strip.z) / 300;
      const baseOpacity = gradientOpacity * depthOpacity * 0.7;

      if (baseOpacity < 0.01) return;

      // Check for hover gradient
      const hoverGradientFactor =
        mouseRef.current && isHoveredRef.current
          ? (() => {
            const dx = Math.abs(mouseRef.current!.x - stripX);
            if (dx < GRADIENT_RADIUS) {
              const factor = 1 - dx / GRADIENT_RADIUS;
              return factor * factor;
            }
            return 0;
          })()
          : 0;

      // Draw strip path
      ctx.beginPath();
      ctx.moveTo(stripX - stripWidth / 2, strip.points[0].y);

      for (let i = 1; i < strip.points.length; i++) {
        ctx.lineTo(stripX - stripWidth / 2, strip.points[i].y);
      }

      for (let i = strip.points.length - 1; i >= 0; i--) {
        ctx.lineTo(stripX + stripWidth / 2, strip.points[i].y);
      }

      ctx.closePath();

      // Apply gradient
      if (hoverGradientFactor > 0 && mouseRef.current) {
        ctx.fillStyle = createHoverGradient(
          ctx,
          stripX,
          stripWidth,
          baseOpacity,
          mouseRef.current.x
        );
      } else {
        ctx.fillStyle = createDefaultGradient(ctx, stripX, stripWidth, baseOpacity, gradientPos);
      }

      ctx.fill();

      // Draw contour lines
      const lineOpacity = baseOpacity * 0.9;

      // Left edge
      ctx.beginPath();
      ctx.moveTo(stripX - stripWidth / 2, strip.points[0].y);
      for (let i = 1; i < strip.points.length; i++) {
        ctx.lineTo(stripX - stripWidth / 2, strip.points[i].y);
      }
      ctx.strokeStyle = `rgba(${accentRGB.r}, ${accentRGB.g}, ${accentRGB.b}, ${lineOpacity})`;
      ctx.lineWidth = 1.5 * scale;
      ctx.stroke();

      // Right edge
      ctx.beginPath();
      ctx.moveTo(stripX + stripWidth / 2, strip.points[0].y);
      for (let i = 1; i < strip.points.length; i++) {
        ctx.lineTo(stripX + stripWidth / 2, strip.points[i].y);
      }
      ctx.strokeStyle = `rgba(${accentRGB.r}, ${accentRGB.g}, ${accentRGB.b}, ${lineOpacity})`;
      ctx.lineWidth = 1.5 * scale;
      ctx.stroke();

      // Horizontal contour lines
      for (let h = 1; h < HORIZONTAL_CONTOUR_LINES; h++) {
        const lineY = (h / HORIZONTAL_CONTOUR_LINES) * height;
        const pointIndex = Math.floor((lineY / height) * (strip.points.length - 1));
        const point = strip.points[pointIndex];

        if (point) {
          ctx.beginPath();
          ctx.moveTo(stripX - stripWidth / 2, point.y);
          ctx.lineTo(stripX + stripWidth / 2, point.y);
          ctx.strokeStyle = `rgba(${accentRGB.r}, ${accentRGB.g}, ${accentRGB.b}, ${lineOpacity * 0.3})`;
          ctx.lineWidth = 0.5 * scale;
          ctx.stroke();
        }
      }
    };

    // Main animation loop
    const animate = () => {
      timeRef.current += 0.016;

      const width = canvas.getBoundingClientRect().width;
      const height = canvas.getBoundingClientRect().height;

      ctx.clearRect(0, 0, width, height);

      updateStrips(width, height);

      // Sort and draw strips (back to front)
      const sortedStrips = [...stripsRef.current].sort((a, b) => a.z - b.z);
      sortedStrips.forEach((strip) => drawStrip(ctx, strip, width, height));

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animate();

    // Mouse event handlers
    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseRef.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
    };

    const handleMouseLeave = () => {
      mouseRef.current = null;
      isHoveredRef.current = false;
    };

    const handleMouseEnter = () => {
      isHoveredRef.current = true;
    };

    canvas.addEventListener("mousemove", handleMouseMove);
    canvas.addEventListener("mouseleave", handleMouseLeave);
    canvas.addEventListener("mouseenter", handleMouseEnter);

    return () => {
      window.removeEventListener("resize", resizeCanvas);
      canvas.removeEventListener("mousemove", handleMouseMove);
      canvas.removeEventListener("mouseleave", handleMouseLeave);
      canvas.removeEventListener("mouseenter", handleMouseEnter);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  return (
    <div className="relative w-screen overflow-hidden" style={{ height: "400px" }}>
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
        style={{ display: "block" }}
      />
    </div>
  );
}
