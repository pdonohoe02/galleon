"use client";

import { useEffect, useRef } from "react";

/**
 * Ambient node field behind the hero.
 *
 * Two rules keep this from breaking when the fold changes shape:
 *
 *  1. Nodes are spread over the canvas RECTANGLE, not fitted into a shape, so
 *     there is no aspect ratio to distort. Node count scales with area, so
 *     density is identical at every window size.
 *  2. Legibility is the CSS scrim's job, not the canvas's. Nothing here reads
 *     the layout to decide what to fade.
 *
 * Each node orbits a fixed home point, so links form and reform without any
 * node ever wrapping or jumping.
 */

/** One node per this many square pixels. */
const AREA_PER_NODE = 9000;
const MIN_NODES = 40;
const MAX_NODES = 190;
/** Link distance as a multiple of average node spacing. Sets mesh density. */
const LINK_REACH = 1.45;

type Node = {
  hx: number;
  hy: number;
  angle: number;
  spin: number;
  orbit: number;
  depth: number;
  hub: boolean;
  x: number;
  y: number;
};

/** R2 low-discrepancy sequence: an even, unpatterned fill of the rectangle. */
function createNodes(count: number): Node[] {
  return Array.from({ length: count }, (_, i) => ({
    hx: ((i + 1) * 0.7548776662) % 1,
    hy: ((i + 1) * 0.5698402909) % 1,
    angle: i * 2.399963,
    spin: (i % 2 ? 1 : -1) * (0.05 + (i % 5) * 0.015),
    orbit: 0.02 + (i % 4) * 0.008,
    depth: 0.45 + (i % 3) * 0.28,
    hub: i % 11 === 5,
    x: 0,
    y: 0,
  }));
}

export function KnowledgeGraph() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let nodes: Node[] = [];
    let width = 0;
    let height = 0;
    let raf = 0;

    const draw = (seconds: number) => {
      if (width === 0 || height === 0 || nodes.length === 0) return;

      const minAxis = Math.min(width, height);
      const link = Math.sqrt((width * height) / nodes.length) * LINK_REACH;
      const cx = width * 0.64;
      const cy = height * 0.46;

      for (const n of nodes) {
        const a = n.angle + seconds * n.spin;
        n.x = n.hx * width + Math.cos(a) * n.orbit * minAxis;
        n.y = n.hy * height + Math.sin(a) * n.orbit * minAxis;
      }

      ctx.clearRect(0, 0, width, height);
      ctx.lineWidth = 1;

      for (let i = 0; i < nodes.length; i++) {
        const a = nodes[i]!;
        for (let j = i + 1; j < nodes.length; j++) {
          const b = nodes[j]!;
          const d = Math.hypot(a.x - b.x, a.y - b.y);
          if (d > link) continue;
          ctx.strokeStyle = `rgba(158,199,238,${(1 - d / link) * 0.4})`;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
      }

      // Spokes: the core reaches whatever is close to it.
      const reach = link * 2.6;
      for (const n of nodes) {
        const d = Math.hypot(n.x - cx, n.y - cy);
        if (d > reach) continue;
        ctx.strokeStyle = `rgba(176,212,246,${(1 - d / reach) * 0.34})`;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(n.x, n.y);
        ctx.stroke();
      }

      for (const n of nodes) {
        if (n.hub) {
          const glow = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, 15);
          glow.addColorStop(0, "rgba(143,190,240,0.32)");
          glow.addColorStop(1, "rgba(143,190,240,0)");
          ctx.fillStyle = glow;
          ctx.beginPath();
          ctx.arc(n.x, n.y, 15, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.fillStyle = `rgba(196,222,248,${0.28 + n.depth * 0.4})`;
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.hub ? 3.6 : 1.4 + n.depth * 1.4, 0, Math.PI * 2);
        ctx.fill();
      }

      // The core: every source in the field resolves to one hub.
      const halo = ctx.createRadialGradient(cx, cy, 0, cx, cy, 80);
      halo.addColorStop(0, "rgba(111,168,232,0.34)");
      halo.addColorStop(1, "rgba(111,168,232,0)");
      ctx.fillStyle = halo;
      ctx.beginPath();
      ctx.arc(cx, cy, 80, 0, Math.PI * 2);
      ctx.fill();

      const pulse = 0.5 + 0.5 * Math.sin(seconds * 0.5);
      ctx.strokeStyle = `rgba(230,239,246,${0.22 - pulse * 0.1})`;
      ctx.beginPath();
      ctx.arc(cx, cy, 15 + pulse * 4, 0, Math.PI * 2);
      ctx.stroke();
      ctx.strokeStyle = "rgba(230,239,246,0.6)";
      ctx.beginPath();
      ctx.arc(cx, cy, 9.5, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = "#EDF4FA";
      ctx.beginPath();
      ctx.arc(cx, cy, 6.5, 0, Math.PI * 2);
      ctx.fill();
    };

    const start = performance.now();
    const elapsed = () => (still ? 8 : (performance.now() - start) / 1000);

    // Resizing clears the backing store, so always repaint after fitting.
    // That one rule is why reduced motion needs no separate code path.
    const fit = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = canvas.clientWidth;
      height = canvas.clientHeight;
      canvas.width = Math.max(1, Math.round(width * dpr));
      canvas.height = Math.max(1, Math.round(height * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const count = Math.round(
        Math.min(
          MAX_NODES,
          Math.max(MIN_NODES, (width * height) / AREA_PER_NODE),
        ),
      );
      if (count !== nodes.length) nodes = createNodes(count);

      draw(elapsed());
    };

    fit();
    const observer = new ResizeObserver(fit);
    observer.observe(canvas);

    if (!still) {
      const loop = () => {
        draw(elapsed());
        raf = requestAnimationFrame(loop);
      };
      raf = requestAnimationFrame(loop);
    }

    return () => {
      cancelAnimationFrame(raf);
      observer.disconnect();
    };
  }, []);

  return <canvas aria-hidden="true" className="glm-graph" ref={canvasRef} />;
}
