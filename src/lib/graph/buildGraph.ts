import { getCollection } from "astro:content";
import { assembleGraph } from "./assembleGraph";
import type { GraphData, GraphNode } from "./assembleGraph";

// Types live in assembleGraph.ts (the astro-free assembly core); re-exported
// here so existing consumers keep importing from buildGraph.
export type { NodeType, GraphNode, GraphEdge, GraphData } from "./assembleGraph";

/**
 * Compile the knowledge graph from content collections at build time.
 * Edges are derived from frontmatter `reference()` relationships, so the
 * Markdown content is the single source of truth for both the canvas and
 * the accessible fallback. Assembly is canonical/order-independent — see
 * assembleGraph.ts (sjai-thb).
 */
export async function buildGraph(): Promise<GraphData> {
  const [projects, topics, outputs] = await Promise.all([
    getCollection("projects"),
    getCollection("topics"),
    getCollection("outputs"),
  ]);

  return assembleGraph({ projects, topics, outputs });
}

/** Group nodes by topic for the accessible fallback list. */
export function groupByTopic(data: GraphData) {
  const topics = data.nodes.filter((n) => n.type === "topic");
  const byId = new Map(data.nodes.map((n) => [n.id, n]));

  return topics.map((topic) => {
    const neighborIds = data.edges
      .filter((e) => e.source === topic.id || e.target === topic.id)
      .map((e) => (e.source === topic.id ? e.target : e.source));

    const neighbors = neighborIds.map((id) => byId.get(id)).filter((n): n is GraphNode => !!n);

    return {
      topic,
      projects: neighbors.filter((n) => n.type === "project"),
      outputs: neighbors.filter((n) => n.type === "output"),
      relatedTopics: neighbors.filter((n) => n.type === "topic"),
    };
  });
}
