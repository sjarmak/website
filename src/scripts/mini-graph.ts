// Compact, mostly-visual live graph for the home page. Renders the real graph
// data (labels hidden for a clean teaser), themes itself from CSS tokens, and
// sends any click to the full searchable explorer.

import type { Core, NodeSingular } from "cytoscape";
import type { GraphData } from "@/lib/graph/buildGraph";
import { readTokens, colorFor, buildStylesheet, toElements } from "./graph-style";

function setupMini(root: HTMLElement) {
  if (root.dataset.wired === "true") return;
  const dataEl = root.querySelector<HTMLScriptElement>("[data-graph-data]");
  const canvasEl = root.querySelector<HTMLElement>("[data-mini-canvas]");
  if (!dataEl?.textContent || !canvasEl) return;

  let data: GraphData;
  try {
    data = JSON.parse(dataEl.textContent) as GraphData;
  } catch {
    return;
  }
  root.dataset.wired = "true";

  let cy: Core | null = null;
  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function highlight(node: NodeSingular) {
    if (!cy) return;
    const nbh = node.closedNeighborhood();
    cy.elements().addClass("faded").removeClass("hl");
    nbh.removeClass("faded").addClass("hl");
  }
  function clearHl() {
    cy?.elements().removeClass("faded hl");
  }

  async function init() {
    if (cy || !canvasEl) return;
    const [{ default: cytoscape }, { default: fcose }] = await Promise.all([
      import("cytoscape"),
      import("cytoscape-fcose"),
    ]);
    cytoscape.use(fcose);

    const tokens = readTokens();
    cy = cytoscape({
      container: canvasEl,
      elements: toElements(data, tokens, { labels: false }),
      style: buildStylesheet(tokens),
      userPanningEnabled: false,
      userZoomingEnabled: false,
      boxSelectionEnabled: false,
      autoungrabify: true,
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
      padding: 16,
    }).run();

    const fit = () => cy && cy.fit(undefined, 16);
    cy.on("layoutstop", fit);
    window.addEventListener("resize", fit);

    cy.on("mouseover", "node", (e) => highlight(e.target as NodeSingular));
    cy.on("mouseout", () => clearHl());
    cy.on("tap", "node", (e) => {
      window.location.href = `/projects/explorer?node=${(e.target as NodeSingular).id()}`;
    });
    cy.on("tap", (e) => {
      if (e.target === cy) window.location.href = "/projects/explorer";
    });
  }

  document.addEventListener("themechange", () => {
    if (!cy) return;
    const t = readTokens();
    cy.nodes().forEach((n) => {
      n.data("color", colorFor(n.data("type"), t));
    });
    cy.style(buildStylesheet(t));
  });

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
  document.querySelectorAll<HTMLElement>("[data-mini-graph]").forEach(setupMini);
}

run();
document.addEventListener("astro:after-swap", run);
