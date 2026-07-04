// Shared, side-effect-free helpers for rendering the knowledge graph with
// Cytoscape. Used by both the full explorer island and the compact home-page
// mini graph so styling/theming stay in one place.

import type { Css, ElementDefinition, StylesheetJson } from "cytoscape";
import type { GraphData, GraphNode, NodeType } from "@/lib/graph/buildGraph";

export type Tokens = Record<string, string>;

export interface NodeTypeStyle {
  /** CSS custom property holding the node fill color (per theme). */
  cssToken: string;
  /** Cytoscape node shape. */
  shape: Css.NodeShape;
  /** Human label for filter chips / legends. */
  label: string;
}

/**
 * Single source of truth for per-type node styling. Key order defines the
 * canonical display order for filter chips and legends.
 */
export const NODE_TYPE_STYLES: Record<NodeType, NodeTypeStyle> = {
  project: { cssToken: "--graph-node-project", shape: "ellipse", label: "Projects" },
  topic: { cssToken: "--graph-node-topic", shape: "round-rectangle", label: "Topics" },
  output: { cssToken: "--graph-node-output", shape: "diamond", label: "Outputs" },
  concept: { cssToken: "--graph-node-concept", shape: "hexagon", label: "Concepts" },
  vaultNote: { cssToken: "--graph-node-note", shape: "tag", label: "Notes" },
};

const NODE_TYPES = Object.keys(NODE_TYPE_STYLES) as NodeType[];

const TOKEN_NAMES: string[] = [
  "--graph-bg",
  ...NODE_TYPES.map((type) => NODE_TYPE_STYLES[type].cssToken),
  "--graph-edge",
  "--graph-label",
  "--graph-fade",
];

export function readTokens(): Tokens {
  const cs = getComputedStyle(document.documentElement);
  const t: Tokens = {};
  for (const name of TOKEN_NAMES) t[name] = cs.getPropertyValue(name).trim();
  return t;
}

export function colorFor(type: GraphNode["type"], t: Tokens): string {
  const style = NODE_TYPE_STYLES[type] ?? NODE_TYPE_STYLES.output;
  return t[style.cssToken];
}

/**
 * Filter chips for the node types actually present in the supplied graph
 * data, in canonical table order.
 */
export function deriveFilterChips(data: GraphData): { type: NodeType; label: string }[] {
  const present = new Set(data.nodes.map((n) => n.type));
  return NODE_TYPES.filter((type) => present.has(type)).map((type) => ({
    type,
    label: NODE_TYPE_STYLES[type].label,
  }));
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
    ...NODE_TYPES.map((type) => ({
      selector: `node[type="${type}"]`,
      style: { shape: NODE_TYPE_STYLES[type].shape },
    })),
    { selector: 'node[type="topic"]', style: { "font-size": 13 } },
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
