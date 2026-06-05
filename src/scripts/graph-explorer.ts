// Client island for the knowledge-graph explorer.
// Progressive enhancement: the accessible fallback list ships in HTML and is
// always usable. The Cytoscape canvas loads lazily (viewport + desktop gated),
// reads its palette from CSS tokens, and restyles on theme change.

import type { Core, ElementDefinition, StylesheetJson, NodeSingular } from "cytoscape";
import type { GraphData, GraphNode } from "@/lib/graph/buildGraph";

type Tokens = Record<string, string>;

const TOKEN_NAMES = [
  "--graph-bg",
  "--graph-node-topic",
  "--graph-node-project",
  "--graph-node-output",
  "--graph-edge",
  "--graph-label",
  "--graph-fade",
] as const;

function readTokens(): Tokens {
  const cs = getComputedStyle(document.documentElement);
  const t: Tokens = {};
  for (const name of TOKEN_NAMES) t[name] = cs.getPropertyValue(name).trim();
  return t;
}

function colorFor(type: GraphNode["type"], t: Tokens): string {
  if (type === "topic") return t["--graph-node-topic"];
  if (type === "project") return t["--graph-node-project"];
  return t["--graph-node-output"];
}

function buildStylesheet(t: Tokens): StylesheetJson {
  return [
    {
      selector: "node",
      style: {
        label: "data(label)",
        color: t["--graph-label"],
        "font-family": "Hanken Grotesk, system-ui, sans-serif",
        "font-size": 11,
        "text-valign": "bottom",
        "text-margin-y": 5,
        "text-wrap": "wrap",
        "text-max-width": "120px",
        "min-zoomed-font-size": 8,
        width: "data(size)",
        height: "data(size)",
        "background-color": "data(color)",
        "border-width": 0,
        "transition-property": "opacity, background-color, border-width",
        "transition-duration": 180,
      },
    },
    { selector: 'node[type="topic"]', style: { shape: "round-rectangle", "font-size": 13 } },
    { selector: 'node[type="project"]', style: { shape: "ellipse" } },
    { selector: 'node[type="output"]', style: { shape: "diamond" } },
    {
      selector: "edge",
      style: {
        width: 1,
        "line-color": t["--graph-edge"],
        "curve-style": "bezier",
        opacity: 0.7,
        "transition-property": "opacity, line-color",
        "transition-duration": 180,
      },
    },
    { selector: 'edge[kind="project-output"]', style: { "line-style": "dashed" } },
    { selector: 'edge[kind="topic-topic"]', style: { width: 1.6 } },
    {
      selector: "node:selected",
      style: { "border-width": 3, "border-color": t["--graph-node-topic"] },
    },
    { selector: ".faded", style: { opacity: Number(t["--graph-fade"]) || 0.16 } },
    { selector: "node.faded", style: { "text-opacity": 0.2 } },
    {
      selector: ".hl",
      style: { opacity: 1, "text-opacity": 1, "line-color": t["--graph-node-topic"] },
    },
  ];
}

function toElements(data: GraphData, t: Tokens): ElementDefinition[] {
  const nodes: ElementDefinition[] = data.nodes.map((n) => ({
    data: {
      id: n.id,
      label: n.label,
      type: n.type,
      color: colorFor(n.type, t),
      size: 26 + (n.weight - 1) * 12,
    },
  }));
  const edges: ElementDefinition[] = data.edges.map((e) => ({
    data: { id: e.id, source: e.source, target: e.target, kind: e.kind },
  }));
  return [...nodes, ...edges];
}

function setup(root: HTMLElement, data: GraphData) {
  if (root.dataset.wired === "true") return;
  root.dataset.wired = "true";

  const byId = new Map(data.nodes.map((n) => [n.id, n]));
  const search = root.querySelector<HTMLInputElement>("[data-graph-search]");
  const fallback = root.querySelector<HTMLElement>("[data-graph-fallback]");
  const filterBtns = Array.from(root.querySelectorAll<HTMLButtonElement>("[data-filter]"));
  const viewToggle = root.querySelector<HTMLButtonElement>("[data-view-toggle]");

  // --- fallback search (works with or without the canvas) ---
  function filterFallback(q: string) {
    if (!fallback) return;
    const query = q.toLowerCase();
    fallback.querySelectorAll<HTMLElement>(".topic").forEach((article) => {
      const text = article.textContent?.toLowerCase() ?? "";
      article.style.display = !query || text.includes(query) ? "" : "none";
    });
  }

  let cy: Core | null = null;
  let canvasActive = false;

  // --- canvas loader (lazy, gated) ---
  const stage = root.querySelector<HTMLElement>("[data-graph-stage]");
  const canvasEl = root.querySelector<HTMLElement>("[data-graph-canvas]");
  const detail = root.querySelector<HTMLElement>("[data-graph-detail]");

  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const isNarrow = window.matchMedia("(max-width: 768px)").matches;
  const canUseCanvas = !!stage && !!canvasEl && !isNarrow;

  async function initCanvas() {
    if (cy || !canvasEl) return;
    const [{ default: cytoscape }, { default: fcose }] = await Promise.all([
      import("cytoscape"),
      import("cytoscape-fcose"),
    ]);
    cytoscape.use(fcose);

    const tokens = readTokens();
    canvasEl.hidden = false;

    cy = cytoscape({
      container: canvasEl,
      elements: toElements(data, tokens),
      style: buildStylesheet(tokens),
      minZoom: 0.3,
      maxZoom: 2.5,
      wheelSensitivity: 0.2,
    });

    cy.layout({
      name: "fcose",
      // @ts-expect-error fcose options are untyped
      quality: "default",
      animate: !prefersReduced,
      animationDuration: 500,
      nodeSeparation: 160,
      nodeRepulsion: 9000,
      idealEdgeLength: (edge: { data: (k: string) => string }) =>
        edge.data("kind") === "topic-topic" ? 120 : 190,
      padding: 40,
    }).run();

    wireCanvasEvents();
    setCanvasActive(true);

    const initial = new URLSearchParams(location.search).get("node");
    if (initial && byId.has(initial)) focusNode(initial);
  }

  function wireCanvasEvents() {
    if (!cy) return;
    cy.on("tap", "node", (evt) => {
      const node = evt.target as NodeSingular;
      highlight(node);
      openDetail(node.id());
      history.replaceState(null, "", `?node=${node.id()}`);
    });
    cy.on("tap", (evt) => {
      if (evt.target === cy) {
        clearHighlight();
        closeDetail();
        history.replaceState(null, "", location.pathname);
      }
    });
    cy.on("mouseover", "node", (evt) => highlight(evt.target as NodeSingular));
    cy.on("mouseout", "node", () => {
      if (!cy?.$("node:selected").length) clearHighlight();
    });
  }

  function highlight(node: NodeSingular) {
    if (!cy) return;
    const nbh = node.closedNeighborhood();
    cy.elements().addClass("faded").removeClass("hl");
    nbh.removeClass("faded").addClass("hl");
  }
  function clearHighlight() {
    cy?.elements().removeClass("faded hl");
  }

  function focusNode(id: string) {
    if (!cy) return;
    const node = cy.getElementById(id);
    if (!node.length) return;
    node.select();
    highlight(node as unknown as NodeSingular);
    cy.animate({ center: { eles: node }, zoom: 1.2 }, { duration: prefersReduced ? 0 : 400 });
    openDetail(id);
  }

  // --- detail panel ---
  function openDetail(id: string) {
    const n = byId.get(id);
    if (!n || !detail) return;
    (detail.querySelector("[data-detail-type]") as HTMLElement).textContent = n.type;
    (detail.querySelector("[data-detail-title]") as HTMLElement).textContent = n.label;
    (detail.querySelector("[data-detail-summary]") as HTMLElement).textContent = n.summary;
    const links = detail.querySelector("[data-detail-links]") as HTMLElement;
    links.innerHTML = "";
    for (const l of n.links) {
      const a = document.createElement("a");
      a.href = l.url;
      a.textContent = `${l.label} ↗`;
      if (l.url.startsWith("http")) a.rel = "noopener";
      links.appendChild(a);
    }
    detail.hidden = false;
  }
  function closeDetail() {
    if (detail) detail.hidden = true;
  }
  root.querySelector("[data-detail-close]")?.addEventListener("click", () => {
    closeDetail();
    clearHighlight();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeDetail();
  });

  // --- type filters ---
  filterBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      const pressed = btn.getAttribute("aria-pressed") === "true";
      btn.setAttribute("aria-pressed", String(!pressed));
      const type = btn.dataset.filter;
      if (cy && type) {
        const sel = cy.nodes(`[type="${type}"]`);
        if (pressed) sel.style("display", "none");
        else sel.style("display", "element");
      }
    });
  });

  // --- search ---
  search?.addEventListener("input", () => {
    const q = search.value.trim();
    filterFallback(q);
    if (!cy) return;
    if (!q) {
      clearHighlight();
      return;
    }
    const matches = cy.nodes().filter((n) => n.data("label").toLowerCase().includes(q.toLowerCase()));
    cy.elements().addClass("faded").removeClass("hl");
    matches.removeClass("faded").addClass("hl");
    if (matches.length) cy.animate({ fit: { eles: matches, padding: 60 } }, { duration: prefersReduced ? 0 : 300 });
  });

  // --- view toggle (graph <-> list) ---
  function setCanvasActive(active: boolean) {
    canvasActive = active;
    root.dataset.canvasActive = String(active);
    if (fallback) fallback.hidden = active;
    if (viewToggle) {
      viewToggle.setAttribute("aria-pressed", String(active));
      viewToggle.textContent = active ? "List view" : "Graph view";
    }
  }
  viewToggle?.addEventListener("click", async () => {
    if (!cy && !canvasActive) {
      await initCanvas();
      return;
    }
    setCanvasActive(!canvasActive);
  });

  // --- theme restyle ---
  document.addEventListener("themechange", () => {
    if (!cy) return;
    const tokens = readTokens();
    cy.nodes().forEach((n) => {
      n.data("color", colorFor(n.data("type"), tokens));
    });
    cy.style(buildStylesheet(tokens));
  });

  // --- lazy init via IntersectionObserver ---
  if (canUseCanvas && stage) {
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          io.disconnect();
          initCanvas();
        }
      },
      { rootMargin: "200px" },
    );
    io.observe(stage);
  }
}

function run() {
  document.querySelectorAll<HTMLElement>("[data-graph-explorer]").forEach((root) => {
    const dataEl = document.querySelector<HTMLScriptElement>("[data-graph-data]");
    if (!dataEl?.textContent) return;
    try {
      const data = JSON.parse(dataEl.textContent) as GraphData;
      setup(root, data);
    } catch {
      /* leave the accessible fallback in place */
    }
  });
}

run();
document.addEventListener("astro:after-swap", run);
