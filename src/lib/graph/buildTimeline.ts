import { getCollection } from "astro:content";
import { buildGraph } from "./buildGraph";
import type { GraphNode, GraphEdge } from "./buildGraph";

export interface TimelineNode extends GraphNode {
  /** Calendar year this node entered the timeline. */
  year: number;
}

export interface TimelineData {
  nodes: TimelineNode[];
  edges: GraphEdge[];
  minYear: number;
  maxYear: number;
}

/**
 * Default year range used when the dataset contains very few (or zero)
 * explicit dates. Chosen to span Stephanie's planetary-science roots through
 * the current year so the slider is always meaningful even for undated content.
 */
const FALLBACK_MIN_YEAR = 2014;
const CURRENT_YEAR = new Date().getFullYear();

/**
 * Year-assignment heuristic (explicit order wins; inference fills gaps):
 *
 * 1. Project node  → `period.start` year from the "projects" collection.
 * 2. Output node   → `date` year from the "outputs" collection.
 * 3. Any node without an explicit date (including all topics) →
 *    the MINIMUM year among its graph neighbours that DO have explicit dates.
 *    If no dated neighbours exist → `maxYear` (treated as "current / unknown").
 *
 * minYear / maxYear are derived from explicit dates only.
 * If fewer than two explicit dates exist the range falls back to
 * FALLBACK_MIN_YEAR..CURRENT_YEAR so the slider remains usable.
 */
export async function buildTimeline(): Promise<TimelineData> {
  const [graphData, projects, outputs] = await Promise.all([
    buildGraph(),
    getCollection("projects"),
    getCollection("outputs"),
  ]);

  // --- build lookup maps for explicit dates ---

  const projectYearById = new Map<string, number>();
  for (const p of projects) {
    if (p.data.period?.start) {
      projectYearById.set(p.id, p.data.period.start.getFullYear());
    }
  }

  const outputYearById = new Map<string, number>();
  for (const o of outputs) {
    if (o.data.date) {
      outputYearById.set(o.id, o.data.date.getFullYear());
    }
  }

  // --- assign explicit years where available ---

  const explicitYears = new Map<string, number>();
  for (const node of graphData.nodes) {
    if (node.type === "project") {
      const y = projectYearById.get(node.id);
      if (y !== undefined) explicitYears.set(node.id, y);
    } else if (node.type === "output") {
      const y = outputYearById.get(node.id);
      if (y !== undefined) explicitYears.set(node.id, y);
    }
  }

  // --- derive range from explicit dates ---

  const allExplicit = [...explicitYears.values()];
  const hasEnoughDates = allExplicit.length >= 2;

  const minYear = hasEnoughDates ? Math.min(...allExplicit) : FALLBACK_MIN_YEAR;
  const maxYear = hasEnoughDates ? Math.max(...allExplicit) : CURRENT_YEAR;

  // --- build neighbour index for inference pass ---

  const neighbourIds = new Map<string, string[]>();
  for (const node of graphData.nodes) neighbourIds.set(node.id, []);

  for (const edge of graphData.edges) {
    neighbourIds.get(edge.source)?.push(edge.target);
    neighbourIds.get(edge.target)?.push(edge.source);
  }

  // --- infer years for undated nodes ---

  function inferYear(nodeId: string): number {
    const neighbours = neighbourIds.get(nodeId) ?? [];
    const datedNeighbourYears = neighbours
      .map((id) => explicitYears.get(id))
      .filter((y): y is number => y !== undefined);
    return datedNeighbourYears.length > 0
      ? Math.min(...datedNeighbourYears)
      : maxYear;
  }

  const nodes: TimelineNode[] = graphData.nodes.map((node) => {
    const explicit = explicitYears.get(node.id);
    return {
      ...node,
      year: explicit !== undefined ? explicit : inferYear(node.id),
    };
  });

  return { nodes, edges: graphData.edges, minYear, maxYear };
}
