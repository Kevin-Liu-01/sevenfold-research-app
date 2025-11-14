"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Container from "./Container";

const chars = " .░▒▓▄▌■▓█";
const latSteps = 40;
const lonSteps = 80;
const minCells = 12;
const overscan = 1.8;
const radiusMultiplier = 0.85;
const defaultCharMetrics = { width: 6, height: 8 };

export default function AsciiDemo() {
  const [frame, setFrame] = useState(0);
  const [viewport, setViewport] = useState({ width: 640, height: 360 });
  const [charMetrics, setCharMetrics] = useState(defaultCharMetrics);
  const hostRef = useRef<HTMLDivElement | null>(null);
  const preRef = useRef<HTMLPreElement | null>(null);
  const measureCtxRef = useRef<CanvasRenderingContext2D | null>(null);

  useEffect(() => {
    const canvas = document.createElement("canvas");
    measureCtxRef.current = canvas.getContext("2d");
    return () => {
      measureCtxRef.current = null;
    };
  }, []);

  useEffect(() => {
    const node = hostRef.current;
    if (!node) {
      return;
    }

    const updateViewport = () => {
      const { width, height } = node.getBoundingClientRect();
      setViewport((prev) =>
        prev.width === width && prev.height === height ? prev : { width, height }
      );
    };

    updateViewport();
    const observer = new ResizeObserver(updateViewport);
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const measure = () => {
      const node = preRef.current;
      if (!node) {
        return;
      }
      const style = window.getComputedStyle(node);
      const fontSize = parseFloat(style.fontSize) || defaultCharMetrics.height;
      const lineHeightValue = style.lineHeight;
      const numericLineHeight = parseFloat(lineHeightValue);
      const charHeight = Number.isNaN(numericLineHeight)
        ? lineHeightValue === "normal"
          ? fontSize * 1.2
          : fontSize
        : lineHeightValue.includes("px")
        ? numericLineHeight
        : numericLineHeight * fontSize;

      let charWidth = fontSize;
      const ctx = measureCtxRef.current;
      if (ctx) {
        ctx.font =
          style.font ||
          `${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
        const measurement = ctx.measureText("█");
        if (measurement.width > 0) {
          charWidth = measurement.width;
        }
      }

      const next = {
        width: Math.max(1, charWidth),
        height: Math.max(1, charHeight),
      };

      setCharMetrics((prev) => {
        if (
          Math.abs(prev.width - next.width) < 0.05 &&
          Math.abs(prev.height - next.height) < 0.05
        ) {
          return prev;
        }
        return next;
      });
    };

    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  useEffect(() => {
    let raf: number;
    const animate = () => {
      setFrame((prev) => prev + 1);
      raf = requestAnimationFrame(animate);
    };
    animate();
    return () => cancelAnimationFrame(raf);
  }, []);

  const asciiFrame = useMemo(() => {
    const { width: viewportPx, height: viewportPy } = viewport;
    if (viewportPx <= 0 || viewportPy <= 0) {
      return "";
    }

    const viewportCols = Math.max(
      minCells,
      Math.ceil(viewportPx / charMetrics.width)
    );
    const viewportRows = Math.max(
      minCells,
      Math.ceil(viewportPy / charMetrics.height)
    );

    const cols = Math.max(minCells, Math.ceil(viewportCols * overscan));
    const rows = Math.max(minCells, Math.ceil(viewportRows * overscan));

    const radius = Math.max(viewportCols, viewportRows) * radiusMultiplier;
    const viewerDist = radius * 3;

    const points: { x: number; y: number; z: number }[] = [];
    for (let i = 0; i < latSteps; i += 1) {
      const theta = Math.PI * (i / (latSteps - 1) - 0.5);
      for (let j = 0; j < lonSteps; j += 1) {
        const phi = (2 * Math.PI * j) / lonSteps;
        const x = radius * Math.cos(theta) * Math.cos(phi);
        const y = radius * Math.cos(theta) * Math.sin(phi);
        const z = radius * Math.sin(theta);
        points.push({ x, y, z });
      }
    }

    const baseSpeed = 0.003;
    const A = frame * baseSpeed;
    const B = frame * baseSpeed * 0.9;
    const C = Math.sin(frame * baseSpeed * 0.3) * 0.4;

    const cosA = Math.cos(A);
    const sinA = Math.sin(A);
    const cosB = Math.cos(B);
    const sinB = Math.sin(B);

    const buffer = Array.from({ length: rows }, () => Array(cols).fill(" "));
    const zBuffer = Array.from({ length: rows }, () =>
      Array(cols).fill(-Infinity)
    );

    for (const p of points) {
      const x1 = p.x * cosA + p.z * sinA;
      const z1 = -p.x * sinA + p.z * cosA;

      const x2 = x1 * cosB - p.y * sinB;
      const y2 = x1 * sinB + p.y * cosB;

      const x = x2 * Math.cos(C) - z1 * Math.sin(C);
      const z = x2 * Math.sin(C) + z1 * Math.cos(C);
      const y = y2;

      const f = viewerDist / (viewerDist - z);

      const xp = Math.floor(x * f + cols / 2);
      const yp = Math.floor(y * f + rows / 2);

      if (xp < 0 || xp >= cols || yp < 0 || yp >= rows) {
        continue;
      }

      if (z <= zBuffer[yp][xp]) {
        continue;
      }

      zBuffer[yp][xp] = z;

      const normalX = x / radius;
      const normalY = y / radius;
      const normalZ = z / radius;

      const lightX = 0.25;
      const lightY = Math.cos(frame * 0.0025);
      const lightZ = 0.8;

      const dotProduct =
        normalX * lightX + normalY * lightY + normalZ * lightZ;
      const luminance = Math.max(0.15, dotProduct);
      const charIdx = Math.min(
        chars.length - 1,
        Math.floor(luminance * (chars.length - 1))
      );
      buffer[yp][xp] = chars[charIdx];
    }

    return buffer.map((row) => row.join("")).join("\n");
  }, [frame, viewport, charMetrics]);

  return (
    <section className="pb-16">
      <Container>
        <div className="min-h-[34rem] w-full overflow-hidden bg-[var(--fg)] shadow-[0_20px_65px_rgba(15,15,15,0.12)]">
          <div
            ref={hostRef}
            className="relative flex h-full w-full items-center justify-center overflow-hidden bg-black"
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.04),transparent_60%),radial-gradient(circle_at_70%_0,rgba(255,255,255,0.03),transparent_65%),linear-gradient(135deg,rgba(255,255,255,0.05),transparent)]" />
            <pre
              ref={preRef}
              aria-hidden
              className="pointer-events-none absolute left-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-1/2 whitespace-pre font-mono text-[6px] leading-[0.95] text-white/85 md:text-[8px] lg:text-[10px]"
            >
              {asciiFrame}
            </pre>
          </div>
        </div>
      </Container>
    </section>
  );
}
