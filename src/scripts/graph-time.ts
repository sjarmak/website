// Temporal evolution slider for the knowledge graph.
// Mirrors the mini-graph.ts init pattern: lazy IntersectionObserver,
// dynamic cytoscape+fcose import, themechange listener, prefers-reduced-motion.

import type { Core, NodeSingular } from "cytoscape";
import type { TimelineData } from "@/lib/graph/buildTimeline";
import { readTokens, colorFor, buildStylesheet, toElements } from "./graph-style";

const PLAY_INTERVAL_MS = 700;

function setupTimeGraph(root: HTMLElement) {
  if (root.dataset.wired === "true") return;

  const dataEl = root.closest("body")?.querySelector<HTMLScriptElement>("[data-time-data]");
  const canvasEl = root.querySelector<HTMLElement>("[data-time-canvas]");
  // Non-null asserted: the runtime guard below returns early if any are absent.
  // The assertion lets the hoisted closures below see the narrowed type, which
  // TS control-flow analysis cannot carry into function declarations.
  const sliderEl = root.querySelector<HTMLInputElement>("[data-year-slider]")!;
  const readoutEl = root.querySelector<HTMLElement>("#year-readout")!;
  const playBtn = root.querySelector<HTMLButtonElement>("[data-play-btn]")!;

  if (!dataEl?.textContent || !canvasEl || !sliderEl || !readoutEl || !playBtn) return;

  let data: TimelineData;
  try {
    data = JSON.parse(dataEl.textContent) as TimelineData;
  } catch {
    return;
  }

  root.dataset.wired = "true";

  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  let cy: Core | null = null;
  let playTimer: ReturnType<typeof setInterval> | null = null;

  // Build a map of nodeId → year for fast lookup after cytoscape inits.
  const nodeYears = new Map<string, number>(data.nodes.map((n) => [n.id, n.year]));

  // ---- year application ----

  function applyYear(year: number) {
    if (!cy) return;

    cy.batch(() => {
      cy!.nodes().forEach((node: NodeSingular) => {
        const nodeYear = nodeYears.get(node.id()) ?? data.maxYear;
        if (nodeYear <= year) {
          node.removeClass("before").addClass("present");
        } else {
          node.removeClass("present").addClass("before");
        }
      });

      // Fade edges whose BOTH endpoints are before the current year
      cy!.edges().forEach((edge) => {
        const sourceYear = nodeYears.get(edge.source().id()) ?? data.maxYear;
        const targetYear = nodeYears.get(edge.target().id()) ?? data.maxYear;
        const edgeYear = Math.max(sourceYear, targetYear);
        if (edgeYear <= year) {
          edge.removeClass("before").addClass("present");
        } else {
          edge.removeClass("present").addClass("before");
        }
      });
    });

    readoutEl.textContent = String(year);
    sliderEl.setAttribute("aria-valuetext", `Year ${year}`);
  }

  // ---- play/pause ----

  function stopPlay() {
    if (playTimer !== null) {
      clearInterval(playTimer);
      playTimer = null;
    }
    playBtn.dataset.playing = "false";
    playBtn.textContent = "▸ Play";
    playBtn.setAttribute("aria-label", "Play timeline animation");
  }

  function startPlay() {
    stopPlay();
    let current = data.minYear;

    // Jump to start
    sliderEl.value = String(current);
    applyYear(current);

    if (prefersReduced) {
      // instant: jump to end
      sliderEl.value = String(data.maxYear);
      applyYear(data.maxYear);
      return;
    }

    playBtn.dataset.playing = "true";
    playBtn.textContent = "⏸ Pause";
    playBtn.setAttribute("aria-label", "Pause timeline animation");

    playTimer = setInterval(() => {
      current += 1;
      sliderEl.value = String(current);
      applyYear(current);
      if (current >= data.maxYear) stopPlay();
    }, PLAY_INTERVAL_MS);
  }

  // ---- cytoscape init ----

  async function init() {
    if (cy || !canvasEl) return;

    const [{ default: cytoscape }, { default: fcose }] = await Promise.all([
      import("cytoscape"),
      import("cytoscape-fcose"),
    ]);
    cytoscape.use(fcose);

    const tokens = readTokens();

    // Build elements from the full TimelineData — toElements expects GraphData
    // shape (nodes/edges), which TimelineData satisfies structurally.
    cy = cytoscape({
      container: canvasEl,
      elements: toElements(data, tokens),
      style: [
        ...buildStylesheet(tokens),
        // "before" = future nodes: faded out
        {
          selector: ".before",
          style: {
            opacity: Number(tokens["--graph-fade"]) || 0.16,
            "text-opacity": 0.1,
          },
        },
        // "present" = nodes in or before current year: fully visible
        {
          selector: ".present",
          style: { opacity: 1, "text-opacity": 1 },
        },
        // Edge "before": faded
        {
          selector: "edge.before",
          style: { opacity: (Number(tokens["--graph-fade"]) || 0.16) * 0.8 },
        },
        {
          selector: "edge.present",
          style: { opacity: 0.7 },
        },
      ],
      userPanningEnabled: true,
      userZoomingEnabled: true,
      boxSelectionEnabled: false,
    });

    cy.layout({
      name: "fcose",
      // @ts-expect-error fcose options are untyped
      quality: "default",
      animate: !prefersReduced,
      animationDuration: 600,
      nodeSeparation: 120,
      nodeRepulsion: 8000,
      idealEdgeLength: 90,
      padding: 24,
    }).run();

    const fit = () => cy && cy.fit(undefined, 24);
    cy.on("layoutstop", fit);
    window.addEventListener("resize", fit);

    root.dataset.canvasActive = "true";

    // Apply the current slider position once layout settles
    cy.one("layoutstop", () => applyYear(Number(sliderEl.value)));
  }

  // ---- theme change ----

  document.addEventListener("themechange", () => {
    if (!cy) return;
    const t = readTokens();
    cy.nodes().forEach((n) => {
      n.data("color", colorFor(n.data("type") as Parameters<typeof colorFor>[0], t));
    });
    cy.style([
      ...buildStylesheet(t),
      {
        selector: ".before",
        style: {
          opacity: Number(t["--graph-fade"]) || 0.16,
          "text-opacity": 0.1,
        },
      },
      { selector: ".present", style: { opacity: 1, "text-opacity": 1 } },
      {
        selector: "edge.before",
        style: { opacity: (Number(t["--graph-fade"]) || 0.16) * 0.8 },
      },
      { selector: "edge.present", style: { opacity: 0.7 } },
    ]);
  });

  // ---- slider wiring ----

  sliderEl.addEventListener("input", () => {
    stopPlay();
    applyYear(Number(sliderEl.value));
  });

  playBtn.addEventListener("click", () => {
    if (playBtn.dataset.playing === "true") {
      stopPlay();
    } else {
      startPlay();
    }
  });

  // ---- lazy init via IntersectionObserver ----

  const io = new IntersectionObserver(
    (entries) => {
      if (entries.some((e) => e.isIntersecting)) {
        io.disconnect();
        init();
      }
    },
    { rootMargin: "200px" },
  );
  io.observe(root);
}

function run() {
  document.querySelectorAll<HTMLElement>("[data-time-explorer]").forEach(setupTimeGraph);
}

run();
document.addEventListener("astro:after-swap", run);
