// Canvas renderer for the Embedding-Space Content Starmap prototype.
// Lazy-init via IntersectionObserver; pan + zoom; hover hit-test; click to navigate.
// No perpetual rAF loop — repaints only on interaction or theme change.

import type { StarPoint, StarKind } from "@/lib/starmap/buildStarmap";

interface TokenMap {
  bg: string;
  label: string;
  project: string;
  topic: string;
  writing: string;
  talk: string;
  publication: string;
  learning: string;
}

function readTokens(): TokenMap {
  const cs = getComputedStyle(document.documentElement);
  const get = (v: string) => cs.getPropertyValue(v).trim();
  // writing/talk/publication/learning use --graph-node-output as base,
  // with slight alpha adjustments handled in draw (we keep one hex per kind).
  return {
    bg: get("--graph-bg"),
    label: get("--graph-label"),
    project: get("--graph-node-project"),
    topic: get("--graph-node-topic"),
    writing: get("--graph-node-output"),
    talk: adjustHex(get("--graph-node-output"), 15),
    publication: adjustHex(get("--graph-node-project"), -20),
    learning: adjustHex(get("--graph-node-topic"), 30),
  };
}

/** Shift each RGB channel by `delta` and clamp to [0,255]. */
function adjustHex(hex: string, delta: number): string {
  const h = hex.replace("#", "");
  if (h.length !== 6) return hex;
  const r = clamp(parseInt(h.slice(0, 2), 16) + delta, 0, 255);
  const g = clamp(parseInt(h.slice(2, 4), 16) + delta, 0, 255);
  const b = clamp(parseInt(h.slice(4, 6), 16) + delta, 0, 255);
  return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

function colorForKind(kind: StarKind, t: TokenMap): string {
  switch (kind) {
    case "project": return t.project;
    case "topic": return t.topic;
    case "writing": return t.writing;
    case "talk": return t.talk;
    case "publication": return t.publication;
    case "learning": return t.learning;
  }
}

// ---- State ----

interface ViewState {
  panX: number;
  panY: number;
  scale: number;
}

interface RendererState {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  points: StarPoint[];
  tokens: TokenMap;
  view: ViewState;
  hoveredIndex: number;
  dpr: number;
  prefersReduced: boolean;
  /** Logical canvas size (CSS pixels) */
  logicalW: number;
  logicalH: number;
}

const POINT_RADIUS = 5;
const HOVER_RADIUS = 8;
const HIT_RADIUS = 20; // px in logical space
const MIN_SCALE = 0.4;
const MAX_SCALE = 6;

function worldToCanvas(
  wx: number,
  wy: number,
  view: ViewState,
  w: number,
  h: number,
): { cx: number; cy: number } {
  return {
    cx: wx * w * view.scale + view.panX,
    cy: wy * h * view.scale + view.panY,
  };
}

function draw(state: RendererState): void {
  const { ctx, points, tokens, view, hoveredIndex, dpr, logicalW, logicalH } = state;

  ctx.save();
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  // Background
  ctx.fillStyle = tokens.bg;
  ctx.fillRect(0, 0, logicalW, logicalH);

  for (let i = 0; i < points.length; i++) {
    const p = points[i];
    const { cx, cy } = worldToCanvas(p.x, p.y, view, logicalW, logicalH);
    const isHovered = i === hoveredIndex;
    const r = isHovered ? HOVER_RADIUS : POINT_RADIUS;
    const color = colorForKind(p.kind, tokens);

    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);

    if (isHovered) {
      // Glow effect for hovered point
      const grd = ctx.createRadialGradient(cx, cy, r * 0.3, cx, cy, r * 2.5);
      grd.addColorStop(0, color);
      grd.addColorStop(1, "transparent");
      ctx.fillStyle = grd;
      ctx.fill();

      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
    } else {
      // Subtle soft circle with slight glow
      ctx.fillStyle = color;
      ctx.globalAlpha = 0.85;
      ctx.fill();
      ctx.globalAlpha = 1;
    }
  }

  // Draw hovered label on top
  if (hoveredIndex >= 0) {
    const p = points[hoveredIndex];
    const { cx, cy } = worldToCanvas(p.x, p.y, view, logicalW, logicalH);

    ctx.font = `500 12px Hanken Grotesk, system-ui, sans-serif`;
    ctx.fillStyle = tokens.label;
    ctx.textAlign = "center";
    ctx.textBaseline = "top";

    const label = p.title;
    const metrics = ctx.measureText(label);
    const pad = 5;
    const lw = metrics.width + pad * 2;
    const lh = 16;
    const lx = cx - lw / 2;
    const ly = cy + HOVER_RADIUS + 4;

    // Label background pill
    ctx.globalAlpha = 0.82;
    ctx.fillStyle = tokens.bg;
    ctx.beginPath();
    ctx.roundRect(lx, ly, lw, lh, 4);
    ctx.fill();
    ctx.globalAlpha = 1;

    ctx.fillStyle = tokens.label;
    ctx.fillText(label, cx, ly + 2);
    ctx.textAlign = "start";
    ctx.textBaseline = "alphabetic";
  }

  ctx.restore();
}

function nearestPoint(
  lx: number,
  ly: number,
  points: StarPoint[],
  view: ViewState,
  w: number,
  h: number,
): number {
  let best = -1;
  let bestDist = HIT_RADIUS * HIT_RADIUS;
  for (let i = 0; i < points.length; i++) {
    const { cx, cy } = worldToCanvas(points[i].x, points[i].y, view, w, h);
    const dx = lx - cx;
    const dy = ly - cy;
    const d2 = dx * dx + dy * dy;
    if (d2 < bestDist) {
      bestDist = d2;
      best = i;
    }
  }
  return best;
}

function setupCanvas(root: HTMLElement): void {
  if (root.dataset.starmapWired === "true") return;

  const canvas = root.querySelector<HTMLCanvasElement>("[data-starmap-canvas]");
  const dataEl = root.querySelector<HTMLScriptElement>("[data-starmap-data]");
  if (!canvas || !dataEl?.textContent) return;

  let points: StarPoint[];
  try {
    points = JSON.parse(dataEl.textContent) as StarPoint[];
  } catch {
    return;
  }

  root.dataset.starmapWired = "true";
  root.dataset.canvasActive = "true";

  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const dpr = window.devicePixelRatio || 1;

  function syncSize(): { lw: number; lh: number } {
    const rect = canvas!.getBoundingClientRect();
    const lw = Math.round(rect.width);
    const lh = Math.round(rect.height);
    canvas!.width = lw * dpr;
    canvas!.height = lh * dpr;
    return { lw, lh };
  }

  let { lw, lh } = syncSize();

  const state: RendererState = {
    canvas,
    ctx,
    points,
    tokens: readTokens(),
    view: { panX: 0, panY: 0, scale: 1 },
    hoveredIndex: -1,
    dpr,
    prefersReduced,
    logicalW: lw,
    logicalH: lh,
  };

  function repaint(): void {
    draw(state);
  }

  repaint();

  // ---- Pan ----
  let dragging = false;
  let dragStartX = 0;
  let dragStartY = 0;
  let dragPanX = 0;
  let dragPanY = 0;

  canvas.addEventListener("pointerdown", (e: PointerEvent) => {
    dragging = true;
    dragStartX = e.clientX;
    dragStartY = e.clientY;
    dragPanX = state.view.panX;
    dragPanY = state.view.panY;
    canvas.setPointerCapture(e.pointerId);
    canvas.style.cursor = "grabbing";
  });

  canvas.addEventListener("pointermove", (e: PointerEvent) => {
    const rect = canvas.getBoundingClientRect();
    const lx = e.clientX - rect.left;
    const ly = e.clientY - rect.top;

    if (dragging) {
      state.view = {
        ...state.view,
        panX: dragPanX + (e.clientX - dragStartX),
        panY: dragPanY + (e.clientY - dragStartY),
      };
      state.hoveredIndex = -1;
      repaint();
      return;
    }

    const idx = nearestPoint(lx, ly, points, state.view, state.logicalW, state.logicalH);
    if (idx !== state.hoveredIndex) {
      state.hoveredIndex = idx;
      canvas.style.cursor = idx >= 0 ? "pointer" : "grab";
      repaint();
    }
  });

  canvas.addEventListener("pointerup", (e: PointerEvent) => {
    const wasDragging = dragging;
    dragging = false;
    canvas.releasePointerCapture(e.pointerId);
    canvas.style.cursor = "grab";

    if (!wasDragging) return;
    const dist = Math.hypot(e.clientX - dragStartX, e.clientY - dragStartY);
    if (dist < 4) {
      // treat as click
      const rect = canvas.getBoundingClientRect();
      const lx = e.clientX - rect.left;
      const ly = e.clientY - rect.top;
      const idx = nearestPoint(lx, ly, points, state.view, state.logicalW, state.logicalH);
      if (idx >= 0) window.location.href = points[idx].url;
    }
  });

  canvas.addEventListener("pointerleave", () => {
    if (state.hoveredIndex !== -1) {
      state.hoveredIndex = -1;
      repaint();
    }
    canvas.style.cursor = "grab";
  });

  canvas.style.cursor = "grab";

  // ---- Zoom ----
  canvas.addEventListener("wheel", (e: WheelEvent) => {
    e.preventDefault();
    const rect = canvas.getBoundingClientRect();
    const lx = e.clientX - rect.left;
    const ly = e.clientY - rect.top;

    const factor = e.deltaY < 0 ? 1.12 : 1 / 1.12;
    const newScale = clamp(state.view.scale * factor, MIN_SCALE, MAX_SCALE);
    if (newScale === state.view.scale) return;

    // Zoom around cursor
    const scaleDelta = newScale / state.view.scale;
    state.view = {
      scale: newScale,
      panX: lx - scaleDelta * (lx - state.view.panX),
      panY: ly - scaleDelta * (ly - state.view.panY),
    };
    repaint();
  }, { passive: false });

  // ---- Resize ----
  const ro = new ResizeObserver(() => {
    const s = syncSize();
    state.logicalW = s.lw;
    state.logicalH = s.lh;
    repaint();
  });
  ro.observe(canvas);

  // ---- Theme change ----
  document.addEventListener("themechange", () => {
    state.tokens = readTokens();
    repaint();
  });
}

function run(): void {
  const root = document.querySelector<HTMLElement>("[data-starmap-root]");
  if (root) {
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          io.disconnect();
          setupCanvas(root);
        }
      },
      { rootMargin: "200px" },
    );
    io.observe(root);
  }
}

run();
document.addEventListener("astro:after-swap", run);
