// Pure graph assembly — the astro-free core of buildGraph, extracted so
// determinism is testable under plain node (buildGraph.ts feeds it the
// collections). The output is CANONICAL and independent of collection
// iteration order (resolves sjai-thb: topic-topic edge direction used to be
// nondeterministic across checkouts — whichever side of a bidirectional
// `related:` pair getCollection yielded first won dedupeEdges):
//   - entries are sorted by id before node/edge construction, and
//   - undirected-semantics edge kinds (topic-topic) always emit their
//     endpoints in lexicographic order, so duplicate bidirectional
//     declarations collapse to one canonical edge no matter the input order.

export type NodeType =
  | "project"
  | "topic"
  | "output"
  | "concept"
  | "vaultNote"
  // Evidence satellite types: spawned client-side around a selected concept
  // (local evidence view); never present in build-time graph payloads.
  | "paper"
  | "digest"
  | "section";

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
  kind:
    | "project-topic"
    | "project-output"
    | "topic-topic"
    | "output-topic"
    | "concept-concept"
    | "concept-topic"
    | "concept-note";
}

export interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

// Minimal structural shapes of the collection entries assembleGraph consumes;
// Astro's CollectionEntry types satisfy them, and tests supply plain objects.
export interface TopicSource {
  id: string;
  data: { title: string; summary: string; weight?: number; related: { id: string }[] };
}
export interface ProjectSource {
  id: string;
  data: {
    title: string;
    summary: string;
    repo?: string;
    homepage?: string;
    topics: { id: string }[];
    outputs: { id: string }[];
  };
}
export interface OutputSource {
  id: string;
  data: { title: string; summary?: string; url: string; kind: string; topics: { id: string }[] };
}

export interface GraphSources {
  projects: ProjectSource[];
  topics: TopicSource[];
  outputs: OutputSource[];
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

const byId = <T extends { id: string }>(entries: T[]): T[] =>
  [...entries].sort((a, b) => a.id.localeCompare(b.id));

/**
 * Assemble the node/edge set from (already loaded) collections. Deterministic:
 * identical inputs in ANY order produce identical output.
 */
export function assembleGraph(sources: GraphSources): GraphData {
  const projects = byId(sources.projects);
  const topics = byId(sources.topics);
  const outputs = byId(sources.outputs);

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
      // Undirected semantics: canonical lexicographic endpoint order, so
      // `a related: b` and `b related: a` yield the SAME edge (sjai-thb).
      const [source, target] = t.id < r.id ? [t.id, r.id] : [r.id, t.id];
      edges.push({ id: `${source}~${target}`, source, target, kind: "topic-topic" });
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
