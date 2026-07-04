import { getCollection } from "astro:content";

export type NodeType = "project" | "topic" | "output" | "concept" | "vaultNote";

export interface GraphNode {
  id: string;
  type: NodeType;
  label: string;
  summary: string;
  /** Primary outbound link for the detail panel (repo/homepage/url). */
  url?: string;
  /** Secondary links for the detail panel. */
  links: { label: string; url: string }[];
  /** For outputs: paper | medium | talk ... */
  kind?: string;
  /** Relative size hint (topics scale by weight/degree). */
  weight: number;
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  kind: "project-topic" | "project-output" | "topic-topic" | "output-topic";
}

export interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

function dedupeEdges(edges: GraphEdge[]): GraphEdge[] {
  const seen = new Set<string>();
  return edges.filter((e) => {
    const key = [e.source, e.target].sort().join("::") + e.kind;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/**
 * Compile the knowledge graph from content collections at build time.
 * Edges are derived from frontmatter `reference()` relationships, so the
 * Markdown content is the single source of truth for both the canvas and
 * the accessible fallback.
 */
export async function buildGraph(): Promise<GraphData> {
  const [projects, topics, outputs] = await Promise.all([
    getCollection("projects"),
    getCollection("topics"),
    getCollection("outputs"),
  ]);

  const nodes: GraphNode[] = [];

  for (const t of topics) {
    nodes.push({
      id: t.id,
      type: "topic",
      label: t.data.title,
      summary: t.data.summary,
      links: [],
      weight: t.data.weight ?? 1,
    });
  }

  for (const p of projects) {
    const links: GraphNode["links"] = [];
    if (p.data.repo) links.push({ label: "Code", url: p.data.repo });
    if (p.data.homepage) links.push({ label: "Live", url: p.data.homepage });
    links.push({ label: "Details", url: `/projects/${p.id}` });
    nodes.push({
      id: p.id,
      type: "project",
      label: p.data.title,
      summary: p.data.summary,
      url: p.data.homepage ?? p.data.repo,
      links,
      weight: 1.5,
    });
  }

  for (const o of outputs) {
    nodes.push({
      id: o.id,
      type: "output",
      label: o.data.title,
      summary: o.data.summary ?? "",
      url: o.data.url,
      links: [{ label: "Open", url: o.data.url }],
      kind: o.data.kind,
      weight: 1,
    });
  }

  const edges: GraphEdge[] = [];

  for (const p of projects) {
    for (const t of p.data.topics) {
      edges.push({ id: `${p.id}~${t.id}`, source: p.id, target: t.id, kind: "project-topic" });
    }
    for (const o of p.data.outputs) {
      edges.push({ id: `${p.id}~${o.id}`, source: p.id, target: o.id, kind: "project-output" });
    }
  }

  for (const t of topics) {
    for (const r of t.data.related) {
      edges.push({ id: `${t.id}~${r.id}`, source: t.id, target: r.id, kind: "topic-topic" });
    }
  }

  for (const o of outputs) {
    for (const t of o.data.topics) {
      edges.push({ id: `${o.id}~${t.id}`, source: o.id, target: t.id, kind: "output-topic" });
    }
  }

  const finalEdges = dedupeEdges(edges);

  // Drop disconnected nodes (degree 0) so standalone projects don't float as
  // orphans in the graph. They still appear on the /projects index.
  const connected = new Set<string>();
  for (const e of finalEdges) {
    connected.add(e.source);
    connected.add(e.target);
  }
  const finalNodes = nodes.filter((n) => connected.has(n.id));

  return { nodes: finalNodes, edges: finalEdges };
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
