// Client island for the linkage explorer: shows how 4 retrieval lenses
// (semantic, lexical, graph, fused) rank related nodes for any selected item.
// Vanilla TS, no dependencies. Re-init on astro:after-swap. Idempotent.

import type { NodeKind, Lane, RelatedItem } from "@/lib/knowledge/types";

// ---- types matching the inline JSON shape ----

interface InlineNode {
  id: string;
  title: string;
  kind: NodeKind;
  url: string;
  meta: string;
}

type InlineRelated = Record<string, Record<Lane, RelatedItem[]>>;

interface ExplorerData {
  nodes: InlineNode[];
  related: InlineRelated;
}

// ---- constants ----

const LANES: Lane[] = ["semantic", "lexical", "graph", "recency", "fused"];

const LANE_EXPLAINER: Record<Lane, string> = {
  semantic: "Closest in meaning (mpnet sentence embeddings, baked at build time).",
  lexical: "Most word-overlap (BM25).",
  graph: "Linked by citations & references.",
  recency: "Newest first (the freshness prior from my digest's hybrid scorer).",
  fused: "Reciprocal Rank Fusion of all four lanes.",
};

// ---- state ----

interface ExplorerState {
  selectedId: string;
  activeLane: Lane;
}

// ---- setup ----

function setup(root: HTMLElement, data: ExplorerData): void {
  if (root.dataset.wired === "true") return;
  root.dataset.wired = "true";

  const nodeMap = new Map<string, InlineNode>(data.nodes.map((n) => [n.id, n]));

  const state: ExplorerState = {
    selectedId: data.nodes[0]?.id ?? "",
    activeLane: "semantic",
  };

  // DOM refs
  const searchInput = root.querySelector<HTMLInputElement>("[data-le-search]");
  const listEl = root.querySelector<HTMLElement>("[data-le-list]");
  const titleTextEl = root.querySelector<HTMLElement>("[data-le-title-text]");
  const titleLinkEl = root.querySelector<HTMLAnchorElement>("[data-le-title-link]");
  const metaEl = root.querySelector<HTMLElement>("[data-le-meta]");
  const tabsEl = root.querySelector<HTMLElement>("[data-le-tabs]");
  const explainerEl = root.querySelector<HTMLElement>("[data-le-explainer]");
  const resultsEl = root.querySelector<HTMLElement>("[data-le-results]");

  // ---- rendering ----

  function renderPanel(): void {
    const node = nodeMap.get(state.selectedId);
    if (!node) return;

    // title + link
    if (titleTextEl) titleTextEl.textContent = node.title + (node.kind === "paper" ? " ↗" : "");
    if (titleLinkEl) {
      titleLinkEl.href = node.url;
      titleLinkEl.setAttribute("aria-label", `Open: ${node.title}`);
      if (node.url.startsWith("http")) {
        titleLinkEl.rel = "noopener noreferrer";
        titleLinkEl.target = "_blank";
      } else {
        titleLinkEl.removeAttribute("rel");
        titleLinkEl.removeAttribute("target");
      }
    }
    if (metaEl) metaEl.textContent = node.meta;

    // tabs
    tabsEl?.querySelectorAll<HTMLButtonElement>("[data-lane]").forEach((btn) => {
      const selected = btn.dataset.lane === state.activeLane;
      btn.setAttribute("aria-selected", String(selected));
    });

    // explainer
    if (explainerEl) explainerEl.textContent = LANE_EXPLAINER[state.activeLane];

    // results
    renderResults(node);
  }

  function renderResults(node: InlineNode): void {
    if (!resultsEl) return;

    const laneItems = data.related[node.id]?.[state.activeLane] ?? [];

    if (laneItems.length === 0) {
      resultsEl.innerHTML =
        `<li class="le-empty muted">No links in this lane.</li>`;
      return;
    }

    const maxScore = Math.max(...laneItems.map((i) => i.score), 0.0001);

    const fragment = document.createDocumentFragment();

    laneItems.forEach((item, idx) => {
      const related = nodeMap.get(item.id);
      const li = document.createElement("li");
      li.className = "le-result-row";

      const rankSpan = document.createElement("span");
      rankSpan.className = "le-rank muted";
      rankSpan.setAttribute("aria-label", `Rank ${idx + 1}`);
      rankSpan.textContent = String(idx + 1);

      const titleLink = document.createElement("a");
      titleLink.href = item.url;
      titleLink.className = "le-result-title";
      titleLink.textContent = item.title;
      if (item.url.startsWith("http")) {
        titleLink.rel = "noopener noreferrer";
        titleLink.target = "_blank";
      }

      const kindChip = document.createElement("span");
      kindChip.className = "le-kind-chip tag";
      kindChip.textContent = related?.kind ?? item.kind;

      const scoreWrap = document.createElement("span");
      scoreWrap.className = "le-score-wrap";
      scoreWrap.setAttribute("aria-label", `Score ${item.score}`);

      const scoreBar = document.createElement("span");
      scoreBar.className = "le-score-bar";
      const pct = Math.max(2, Math.round((item.score / maxScore) * 100));
      scoreBar.style.width = `${pct}%`;

      const scoreNum = document.createElement("span");
      scoreNum.className = "le-score-num muted";
      scoreNum.textContent = item.score.toFixed(3);

      scoreWrap.appendChild(scoreBar);
      scoreWrap.appendChild(scoreNum);

      li.appendChild(rankSpan);
      li.appendChild(titleLink);
      li.appendChild(kindChip);
      li.appendChild(scoreWrap);

      fragment.appendChild(li);
    });

    resultsEl.innerHTML = "";
    resultsEl.appendChild(fragment);
  }

  // ---- event wiring ----

  // node buttons
  listEl?.querySelectorAll<HTMLButtonElement>("[data-node-id]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.dataset.nodeId;
      if (!id || id === state.selectedId) return;

      // update aria-pressed on all node buttons
      listEl.querySelectorAll<HTMLButtonElement>("[data-node-id]").forEach((b) => {
        b.setAttribute("aria-pressed", String(b.dataset.nodeId === id));
      });

      state.selectedId = id;
      renderPanel();
    });
  });

  // lane tabs — full tablist keyboard support (arrow keys)
  tabsEl?.querySelectorAll<HTMLButtonElement>("[data-lane]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const lane = btn.dataset.lane as Lane | undefined;
      if (!lane || !LANES.includes(lane)) return;
      state.activeLane = lane;
      renderPanel();
    });
  });

  tabsEl?.addEventListener("keydown", (e) => {
    const focused = document.activeElement as HTMLButtonElement | null;
    if (!focused?.dataset.lane) return;
    const idx = LANES.indexOf(focused.dataset.lane as Lane);
    if (idx === -1) return;

    let next = idx;
    if (e.key === "ArrowRight") next = (idx + 1) % LANES.length;
    else if (e.key === "ArrowLeft") next = (idx - 1 + LANES.length) % LANES.length;
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = LANES.length - 1;
    else return;

    e.preventDefault();
    const target = tabsEl.querySelector<HTMLButtonElement>(`[data-lane="${LANES[next]}"]`);
    if (!target) return;
    target.focus();
    state.activeLane = LANES[next];
    renderPanel();
  });

  // search filter
  searchInput?.addEventListener("input", () => {
    const q = searchInput.value.trim().toLowerCase();
    listEl?.querySelectorAll<HTMLButtonElement>("[data-node-id]").forEach((btn) => {
      const title = (btn.textContent ?? "").toLowerCase();
      btn.style.display = !q || title.includes(q) ? "" : "none";
    });
    // hide group labels that have no visible buttons
    listEl?.querySelectorAll<HTMLElement>("[data-kind]").forEach((group) => {
      const anyVisible = Array.from(
        group.querySelectorAll<HTMLButtonElement>("[data-node-id]"),
      ).some((b) => b.style.display !== "none");
      (group as HTMLElement).style.display = anyVisible ? "" : "none";
    });
  });

  // initial render
  renderPanel();
}

// ---- init ----

function run(): void {
  document.querySelectorAll<HTMLElement>("[data-linkage-explorer]").forEach((root) => {
    const dataEl = document.querySelector<HTMLScriptElement>("[data-le-data]");
    if (!dataEl?.textContent) return;
    let data: ExplorerData;
    try {
      data = JSON.parse(dataEl.textContent) as ExplorerData;
    } catch {
      return;
    }
    setup(root, data);
  });
}

run();
document.addEventListener("astro:after-swap", run);

// ---- Result row styles injected once into <head> ----
// These target dynamically-created elements; scoped <style> in Astro won't reach them.

(function injectStyles() {
  if (document.getElementById("le-dynamic-styles")) return;
  const style = document.createElement("style");
  style.id = "le-dynamic-styles";
  style.textContent = `
    .le-result-row {
      display: grid;
      grid-template-columns: 1.4rem 1fr auto auto;
      align-items: center;
      gap: var(--space-2xs);
      padding: 0.4em 0;
      border-bottom: var(--border-hairline);
      font-size: var(--step--1);
      min-width: 0;
    }
    .le-result-row:last-child {
      border-bottom: none;
    }
    .le-rank {
      font-family: var(--font-mono);
      font-size: 0.75em;
      text-align: end;
    }
    .le-result-title {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      min-width: 0;
    }
    .le-kind-chip {
      white-space: nowrap;
      flex-shrink: 0;
    }
    .le-score-wrap {
      display: flex;
      align-items: center;
      gap: 0.3em;
      min-width: 4.5rem;
    }
    .le-score-bar {
      display: inline-block;
      height: 4px;
      max-width: 3rem;
      border-radius: 2px;
      background: var(--color-accent);
      opacity: 0.65;
      flex-shrink: 0;
    }
    .le-score-num {
      font-family: var(--font-mono);
      font-size: 0.72em;
      white-space: nowrap;
    }
    .le-empty {
      padding: var(--space-s) 0;
      font-size: var(--step--1);
      font-style: italic;
    }
  `;
  document.head.appendChild(style);
})();

export {};
