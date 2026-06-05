// Shared, side-effect-free helpers for rendering the knowledge graph with
// Cytoscape. Used by both the full explorer island and the compact home-page
// mini graph so styling/theming stay in one place.

import type { ElementDefinition, StylesheetJson } from "cytoscape";
import type { GraphData, GraphNode } from "@/lib/graph/buildGraph";

export type Tokens = Record<string, string>;

const TOKEN_NAMES = [
  "--graph-bg",
  "--graph-node-topic",
  "--graph-node-project",
  "--graph-node-output",
  "--graph-edge",
  "--graph-label",
  "--graph-fade",
] as const;

export function readTokens(): Tokens {
  const cs = getComputedStyle(document.documentElement);
  const t: Tokens = {};
  for (const name of TOKEN_NAMES) t[name] = cs.getPropertyValue(name).trim();
  return t;
}

export function colorFor(type: GraphNode["type"], t: Tokens): string {
  if (type === "topic") return t["--graph-node-topic"];
  if (type === "project") return t["--graph-node-project"];
  return t["--graph-node-output"];
}

export function buildStylesheet(t: Tokens): StylesheetJson {
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

export function toElements(data: GraphData, t: Tokens, opts?: { labels?: boolean }): ElementDefinition[] {
  const nodes: ElementDefinition[] = data.nodes.map((n) => ({
    data: {
      id: n.id,
      label: opts?.labels === false ? "" : n.label,
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
