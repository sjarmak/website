import type {
  Core,
  ElementDefinition,
  NodeSingular,
  StylesheetJson,
} from "cytoscape";
import type {
  BookGraphData,
  BookGraphNode,
  PracticeClassification,
} from "@/lib/books/bookGraph.mjs";

type Palette = Record<string, string>;
type ExplorerView = "list" | "graph" | "references";

const tokenNames = [
  "--graph-node-topic",
  "--graph-node-project",
  "--graph-node-concept",
  "--graph-node-output",
  "--graph-edge",
  "--graph-label",
  "--graph-fade",
];

function palette(): Palette {
  const styles = getComputedStyle(document.documentElement);
  return Object.fromEntries(tokenNames.map((name) => [name, styles.getPropertyValue(name).trim()]));
}

function graphStyles(colors: Palette): StylesheetJson {
  return [
    {
      selector: "node",
      style: {
        label: "data(displayLabel)",
        color: colors["--graph-label"],
        "font-family": "Hanken Grotesk, system-ui, sans-serif",
        "font-size": 15,
        "font-weight": 600,
        "text-wrap": "wrap",
        "text-max-width": "150px",
        "text-valign": "bottom",
        "text-margin-y": 7,
        "min-zoomed-font-size": 3,
        width: "data(size)",
        height: "data(size)",
        "background-color": "data(color)",
        "border-width": 0,
      },
    },
    {
      selector: 'node[kind="book"]',
      style: { shape: "diamond", "font-size": 24 },
    },
    {
      selector: 'node[kind="part"]',
      style: { shape: "round-rectangle", "font-size": 20 },
    },
    { selector: 'node[kind="chapter"]', style: { shape: "ellipse" } },
    {
      selector: 'node[kind="practice"]',
      style: { shape: "ellipse", "text-opacity": 0 },
    },
    {
      selector: 'node[kind="practice"].matched, node[kind="practice"]:selected',
      style: { "text-opacity": 1, label: "data(label)" },
    },
    {
      selector: "edge",
      style: {
        width: 1.2,
        "line-color": colors["--graph-edge"],
        "curve-style": "bezier",
        opacity: 0.9,
      },
    },
    {
      selector: 'edge[edgeKind="chapter-teaches"]',
      style: { width: 1.5, "line-color": colors["--graph-node-topic"], opacity: 0.72 },
    },
    {
      selector: 'edge[edgeKind="chapter-carries"]',
      style: {
        "line-style": "dashed",
        "line-color": colors["--graph-node-output"],
        opacity: 0.58,
      },
    },
    {
      selector: "node:selected",
      style: { "border-width": 3, "border-color": colors["--graph-node-topic"] },
    },
    { selector: ".faded", style: { opacity: Number(colors["--graph-fade"]) || 0.16 } },
    { selector: "node.faded", style: { "text-opacity": 0.15 } },
    { selector: ".matched", style: { opacity: 1 } },
  ];
}

function positionFor(
  node: BookGraphNode,
  practicesByChapter: Map<number, BookGraphNode[]>,
  chaptersByPart: Map<number, BookGraphNode[]>,
) {
  if (node.kind === "book") return { x: 0, y: 0 };
  const part = node.part ?? 1;
  const partAngle = -Math.PI / 2 + ((part - 1) * Math.PI * 2) / 6;
  const partCenter = { x: Math.cos(partAngle) * 720, y: Math.sin(partAngle) * 720 };
  if (node.kind === "part") return partCenter;

  const chapterSiblings = chaptersByPart.get(part) ?? [];
  const chapterIndex = Math.max(
    0,
    chapterSiblings.findIndex((chapter) => chapter.chapter === node.chapter),
  );
  const chapterOffset = (chapterIndex - (chapterSiblings.length - 1) / 2) * 0.72;
  const chapterAngle = partAngle + chapterOffset;
  const chapterCenter = {
    x: partCenter.x + Math.cos(chapterAngle) * 340,
    y: partCenter.y + Math.sin(chapterAngle) * 340,
  };
  if (node.kind === "chapter") return chapterCenter;

  const siblings = practicesByChapter.get(node.chapter ?? 0) ?? [];
  const index = Math.max(0, siblings.findIndex((practice) => practice.id === node.id));
  const innerCount = Math.min(10, siblings.length);
  const inner = index < innerCount;
  const ringIndex = inner ? index : index - innerCount;
  const ringCount = inner ? innerCount : siblings.length - innerCount;
  const radius = inner ? 78 : 132;
  const angle = partAngle + (ringIndex * Math.PI * 2) / Math.max(1, ringCount);
  return {
    x: chapterCenter.x + Math.cos(angle) * radius,
    y: chapterCenter.y + Math.sin(angle) * radius,
  };
}

function elements(data: BookGraphData, colors: Palette): ElementDefinition[] {
  const practicesByChapter = new Map<number, BookGraphNode[]>();
  const chaptersByPart = new Map<number, BookGraphNode[]>();
  for (const node of data.nodes) {
    if (node.kind === "chapter" && node.part !== undefined) {
      chaptersByPart.set(node.part, [...(chaptersByPart.get(node.part) ?? []), node]);
    }
    if (node.kind !== "practice" || node.chapter === undefined) continue;
    practicesByChapter.set(node.chapter, [...(practicesByChapter.get(node.chapter) ?? []), node]);
  }
  const colorByKind = {
    book: colors["--graph-node-project"],
    part: colors["--graph-node-topic"],
    chapter: colors["--graph-node-concept"],
    practice: colors["--graph-node-output"],
  };
  const sizeByKind = { book: 62, part: 50, chapter: 34, practice: 13 };
  return [
    ...data.nodes.map((node) => ({
      data: {
        id: node.id,
        label: node.label,
        displayLabel:
          node.kind === "practice"
            ? ""
            : node.kind === "part"
              ? `Part ${node.part}`
              : node.kind === "chapter"
                ? `Chapter ${node.chapter}`
                : node.label,
        kind: node.kind,
        classification: node.classification ?? "",
        part: node.part ?? 0,
        color: colorByKind[node.kind],
        size: sizeByKind[node.kind],
      },
      position: positionFor(node, practicesByChapter, chaptersByPart),
    })),
    ...data.edges.map((edge) => ({
      data: {
        id: edge.id,
        source: edge.source,
        target: edge.target,
        edgeKind: edge.kind,
      },
    })),
  ];
}

function setup(root: HTMLElement, data: BookGraphData) {
  if (root.dataset.wired === "true") return;
  root.dataset.wired = "true";

  const byId = new Map(data.nodes.map((node) => [node.id, node]));
  const search = root.querySelector<HTMLInputElement>("[data-book-graph-search]");
  const partFilter = root.querySelector<HTMLSelectElement>("[data-part-filter]");
  const practiceFilters = Array.from(
    root.querySelectorAll<HTMLButtonElement>("[data-practice-filter]"),
  );
  const viewButtons = Array.from(root.querySelectorAll<HTMLButtonElement>("[data-book-view]"));
  const stage = root.querySelector<HTMLElement>("[data-book-graph-stage]");
  const canvas = root.querySelector<HTMLElement>("[data-book-graph-canvas]");
  const fallback = root.querySelector<HTMLElement>("[data-book-graph-fallback]");
  const referenceIndex = root.querySelector<HTMLElement>("[data-book-reference-index]");
  const graphKey = root.querySelector<HTMLElement>("[data-book-graph-key]");
  const detail = root.querySelector<HTMLElement>("[data-book-graph-detail]");
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const smallViewport = window.matchMedia("(max-width: 40rem)");
  const activeClasses = new Set<PracticeClassification>(["taught", "untaught"]);
  let cy: Core | null = null;
  let activeView: ExplorerView = "list";

  function state() {
    return {
      query: search?.value.trim().toLowerCase() ?? "",
      part: partFilter?.value ?? "all",
    };
  }

  function practiceMatches(node: BookGraphNode, query: string, part: string) {
    return (
      node.kind === "practice" &&
      activeClasses.has(node.classification as PracticeClassification) &&
      (part === "all" || node.part === Number(part)) &&
      (!query || `${node.label} ${node.summary}`.toLowerCase().includes(query))
    );
  }

  function nodeMatches(node: BookGraphNode, query: string, part: string) {
    if (node.kind === "book") return true;
    if (part !== "all" && node.part !== Number(part)) return false;
    if (node.kind === "practice") return practiceMatches(node, query, part);
    if (!query) return true;
    if (`${node.label} ${node.summary}`.toLowerCase().includes(query)) return true;
    if (node.kind === "chapter") {
      return data.nodes.some(
        (candidate) => candidate.chapter === node.chapter && practiceMatches(candidate, query, part),
      );
    }
    if (node.kind === "part") {
      return data.nodes.some((candidate) => candidate.part === node.part && practiceMatches(candidate, query, part));
    }
    return practiceMatches(node, query, part);
  }

  function filterList() {
    if (!fallback) return;
    const { query, part } = state();
    fallback.querySelectorAll<HTMLElement>("[data-book-graph-practice]").forEach((item) => {
      const classification = item.dataset.classification as PracticeClassification;
      const matches =
        activeClasses.has(classification) &&
        (part === "all" || item.dataset.part === part) &&
        (!query || item.dataset.searchText?.includes(query));
      item.hidden = !matches;
    });
    fallback.querySelectorAll<HTMLElement>("[data-practice-group]").forEach((group) => {
      group.hidden = !group.querySelector("[data-book-graph-practice]:not([hidden])");
    });
    fallback.querySelectorAll<HTMLElement>("[data-book-graph-chapter]").forEach((chapter) => {
      const chapterMatch = !!query && chapter.dataset.searchText?.includes(query);
      const hasPractice = !!chapter.querySelector("[data-book-graph-practice]:not([hidden])");
      chapter.hidden = (part !== "all" && chapter.dataset.part !== part) || (!chapterMatch && !hasPractice);
    });
    fallback.querySelectorAll<HTMLElement>("[data-book-graph-part]").forEach((partSection) => {
      partSection.hidden = !partSection.querySelector("[data-book-graph-chapter]:not([hidden])");
    });
    const any = !!fallback.querySelector("[data-book-graph-practice]:not([hidden])");
    const empty = fallback.querySelector<HTMLElement>("[data-book-graph-empty]");
    if (empty) empty.hidden = any;
  }

  function filterCanvas() {
    if (!cy) return;
    const { query, part } = state();
    const visible = new Set(
      data.nodes.filter((node) => nodeMatches(node, query, part)).map((node) => node.id),
    );
    cy.batch(() => {
      cy?.nodes().forEach((element) => {
        element.style("display", visible.has(element.id()) ? "element" : "none");
        element.toggleClass("matched", !!query && visible.has(element.id()));
      });
      cy?.edges().forEach((edge) => {
        const show = visible.has(edge.source().id()) && visible.has(edge.target().id());
        edge.style("display", show ? "element" : "none");
      });
    });
    const visibleElements = cy.elements(":visible");
    if (visibleElements.length) {
      cy.animate(
        { fit: { eles: visibleElements, padding: 55 } },
        { duration: reducedMotion ? 0 : 250 },
      );
    }
  }

  function filterReferences() {
    if (!referenceIndex) return;
    const { query, part } = state();
    referenceIndex.querySelectorAll<HTMLElement>("[data-book-reference]").forEach((item) => {
      const parts = item.dataset.parts?.split(",") ?? [];
      const matchesPart = part === "all" || parts.includes(part);
      const matchesQuery = !query || item.dataset.searchText?.includes(query);
      item.hidden = !matchesPart || !matchesQuery;
    });
    referenceIndex.querySelectorAll<HTMLElement>("[data-reference-group]").forEach((group) => {
      group.hidden = !group.querySelector("[data-book-reference]:not([hidden])");
    });
    const any = !!referenceIndex.querySelector("[data-book-reference]:not([hidden])");
    const empty = referenceIndex.querySelector<HTMLElement>("[data-reference-empty]");
    if (empty) empty.hidden = any;
  }

  function applyFilters() {
    filterList();
    filterCanvas();
    filterReferences();
  }

  function setView(view: ExplorerView, updateUrl = false) {
    activeView = view;
    root.dataset.view = view;
    if (stage) stage.hidden = view !== "graph";
    if (fallback) fallback.hidden = view !== "list";
    if (referenceIndex) referenceIndex.hidden = view !== "references";
    if (graphKey) graphKey.hidden = view === "references";
    viewButtons.forEach((button) => {
      button.setAttribute("aria-pressed", String(button.dataset.bookView === view));
    });
    if (search) {
      search.placeholder = view === "references"
        ? "Source, author, chapter, or practice"
        : "Chapter or practice";
    }
    if (view === "graph" && cy) {
      cy.resize();
      filterCanvas();
    }
    if (updateUrl) {
      const url = new URL(location.href);
      url.searchParams.set("view", view);
      if (view !== "graph") url.searchParams.delete("node");
      history.replaceState(null, "", url);
    }
  }

  function closeDetail() {
    if (detail) detail.hidden = true;
    cy?.elements().removeClass("faded matched");
    filterCanvas();
  }

  function openDetail(id: string) {
    const node = byId.get(id);
    if (!node || !detail) return;
    const kind = detail.querySelector<HTMLElement>("[data-book-graph-detail-kind]");
    const title = detail.querySelector<HTMLElement>("[data-book-graph-detail-title]");
    const summary = detail.querySelector<HTMLElement>("[data-book-graph-detail-summary]");
    const link = detail.querySelector<HTMLAnchorElement>("[data-book-graph-detail-link]");
    if (kind) kind.textContent = node.classification ?? node.kind;
    if (title) title.textContent = node.label;
    if (summary) summary.textContent = node.summary;
    if (link) link.href = node.href;
    detail.hidden = false;
  }

  async function initializeCanvas() {
    if (cy || !canvas) return;
    const module = await import("cytoscape").catch(() => null);
    if (!module) return;
    const colors = palette();
    cy = module.default({
      container: canvas,
      elements: elements(data, colors),
      style: graphStyles(colors),
      layout: { name: "preset", fit: true, padding: 55 },
      minZoom: 0.12,
      maxZoom: 2.5,
      wheelSensitivity: 0.2,
    });
    cy.on("tap", "node", (event) => {
      const node = event.target as NodeSingular;
      cy?.elements().addClass("faded").removeClass("matched");
      node.closedNeighborhood().removeClass("faded").addClass("matched");
      node.select();
      openDetail(node.id());
      const url = new URL(location.href);
      url.searchParams.set("node", node.id());
      history.replaceState(null, "", url);
    });
    cy.on("tap", (event) => {
      if (event.target !== cy) return;
      closeDetail();
      const url = new URL(location.href);
      url.searchParams.delete("node");
      history.replaceState(null, "", url);
    });
    applyFilters();

    const initialId = new URL(location.href).searchParams.get("node");
    if (initialId && byId.has(initialId)) {
      const node = cy.getElementById(initialId);
      node.select();
      openDetail(initialId);
      cy.animate({ center: { eles: node }, zoom: 1.15 }, { duration: reducedMotion ? 0 : 300 });
    }
  }

  async function activateView(view: ExplorerView, updateUrl = false) {
    setView(view, updateUrl);
    if (view === "graph" && !cy) await initializeCanvas();
    if (view === "graph" && cy) {
      cy.resize();
      filterCanvas();
    }
  }

  search?.addEventListener("input", applyFilters);
  partFilter?.addEventListener("change", applyFilters);
  practiceFilters.forEach((button) => {
    button.addEventListener("click", () => {
      const classification = button.dataset.practiceFilter as PracticeClassification;
      if (activeClasses.has(classification)) activeClasses.delete(classification);
      else activeClasses.add(classification);
      button.setAttribute("aria-pressed", String(activeClasses.has(classification)));
      applyFilters();
    });
  });
  viewButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const view = button.dataset.bookView as ExplorerView;
      if (view === activeView) return;
      void activateView(view, true);
    });
  });
  root.querySelector("[data-book-graph-detail-close]")?.addEventListener("click", closeDetail);
  root.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeDetail();
  });
  document.addEventListener("themechange", () => {
    if (!cy) return;
    const colors = palette();
    cy.nodes().forEach((node) => {
      const source = byId.get(node.id());
      const token = source?.kind === "book"
        ? "--graph-node-project"
        : source?.kind === "part"
          ? "--graph-node-topic"
          : source?.kind === "chapter"
            ? "--graph-node-concept"
            : "--graph-node-output";
      node.data("color", colors[token]);
    });
    cy.style(graphStyles(colors));
  });

  applyFilters();
  const params = new URL(location.href).searchParams;
  const requestedView = params.get("view");
  const initialView: ExplorerView = requestedView === "references"
    ? "references"
    : requestedView === "list"
      ? "list"
      : requestedView === "graph" || params.has("node") || !smallViewport.matches
        ? "graph"
        : "list";
  void activateView(initialView);
}

function run() {
  document.querySelectorAll<HTMLElement>("[data-book-graph-explorer]").forEach((root) => {
    const payload = document.querySelector<HTMLScriptElement>("[data-book-graph-data]");
    if (!payload?.textContent) return;
    try {
      setup(root, JSON.parse(payload.textContent) as BookGraphData);
    } catch {
      // The server-rendered list remains fully usable.
    }
  });
}

run();
document.addEventListener("astro:after-swap", run);
