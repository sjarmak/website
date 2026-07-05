/**
 * Concept graph: the concepts registry rendered in the explorer's GraphData
 * shape, with evidence membership DERIVED at build time (never stored) via
 * src/lib/knowledge/conceptMembership.
 *
 * - Nodes: every concept, the topics concepts anchor to, and vaultNote nodes
 *   for `vault:` assignments. Node id namespaces: concepts use their bare
 *   slug, topics use `topic:<id>`, vault notes use `vault:<id>`.
 * - Rendered concept<->concept edges are capped at CONCEPT_EDGE_TOP_K per
 *   node (greedy, strongest first); the FULL weighted co-occurrence list is
 *   retained in `conceptEdges` for the detail panel.
 * - `gaps` lists concept pairs both above median total co-occurrence weight
 *   that have no direct edge anywhere in the full list.
 */
import { readdirSync, readFileSync } from "node:fs";
import { basename, join } from "node:path";
import { loadConcepts, type ConceptEntry } from "../knowledge/conceptAliases.ts";
import {
  loadConceptAssignments,
  splitAssignmentKey,
  type ConceptAssignments,
} from "../knowledge/conceptAssignments.ts";
import {
  deriveConceptMembership,
  loadDigestDocs,
  loadExplorers,
  parseFrontmatterBlock,
  type ConceptEvidence,
  type CooccurrenceGroup,
  type DigestDoc,
  type Explorer,
} from "../knowledge/conceptMembership.ts";
import type { GraphData, GraphEdge, GraphNode } from "./buildGraph";

/** Rendered concept<->concept edge budget per node (tunable). */
export const CONCEPT_EDGE_TOP_K = 3;

export const TOPICS_DIR = "src/content/topics";

/** One entry in the FULL weighted co-occurrence list. */
export interface WeightedConceptEdge {
  source: string;
  target: string;
  weight: number;
  /** Digest slugs where both concepts co-occur as facets. */
  sharedDigests: string[];
  /** Paper ids whose branch sections resolve to both concepts. */
  sharedPapers: string[];
}

/** Above-median pair with no direct co-occurrence edge. */
export interface ConceptGap {
  source: string;
  target: string;
  sourceWeight: number;
  targetWeight: number;
}

export interface ConceptGraphNode extends GraphNode {
  /** Present on concept nodes: evidence lists for the detail panel. */
  evidence?: ConceptEvidence;
}

export interface ConceptGraphData extends GraphData {
  nodes: ConceptGraphNode[];
  /** FULL weighted concept<->concept list (rendered edges are the capped subset). */
  conceptEdges: WeightedConceptEdge[];
  gaps: ConceptGap[];
}

export interface TopicMeta {
  title: string;
  summary: string;
  weight?: number;
}

/** Load topic frontmatter (title/summary/weight) for concept anchor nodes. */
export function loadTopicMeta(dir: string = TOPICS_DIR): Map<string, TopicMeta> {
  const meta = new Map<string, TopicMeta>();
  const files = readdirSync(dir)
    .filter((f) => f.endsWith(".md") || f.endsWith(".mdx"))
    .sort();
  for (const file of files) {
    const slug = basename(file).replace(/\.(md|mdx)$/, "");
    const fm = parseFrontmatterBlock(readFileSync(join(dir, file), "utf8"), `topics/${slug}`);
    if (typeof fm.title !== "string" || typeof fm.summary !== "string") {
      throw new Error(`topics/${slug}: \`title\` and \`summary\` are required`);
    }
    meta.set(slug, {
      title: fm.title,
      summary: fm.summary,
      weight: typeof fm.weight === "number" ? fm.weight : undefined,
    });
  }
  return meta;
}

const edgeKey = (e: { source: string; target: string }): string => `${e.source}~${e.target}`;

const byWeightDescThenKey = (a: WeightedConceptEdge, b: WeightedConceptEdge): number =>
  b.weight - a.weight || edgeKey(a).localeCompare(edgeKey(b));

/** Aggregate co-occurrence groups into the full weighted edge list. */
export function computeCooccurrenceEdges(groups: readonly CooccurrenceGroup[]): WeightedConceptEdge[] {
  const byPair = new Map<string, WeightedConceptEdge>();
  for (const group of groups) {
    const concepts = [...new Set(group.concepts)].sort();
    for (let i = 0; i < concepts.length; i++) {
      for (let j = i + 1; j < concepts.length; j++) {
        const key = `${concepts[i]}~${concepts[j]}`;
        let edge = byPair.get(key);
        if (edge === undefined) {
          edge = { source: concepts[i], target: concepts[j], weight: 0, sharedDigests: [], sharedPapers: [] };
          byPair.set(key, edge);
        }
        edge.weight += 1;
        (group.kind === "digest" ? edge.sharedDigests : edge.sharedPapers).push(group.id);
      }
    }
  }
  return [...byPair.values()].sort(byWeightDescThenKey);
}

/**
 * Cap the rendered edge set at k per node: edges are taken strongest-first
 * and kept only while BOTH endpoints are under budget, so no node renders
 * more than k concept<->concept edges. Deterministic (weight desc, key asc).
 */
export function capConceptEdges(
  edges: readonly WeightedConceptEdge[],
  k: number = CONCEPT_EDGE_TOP_K,
): WeightedConceptEdge[] {
  const sorted = [...edges].sort(byWeightDescThenKey);
  const degree = new Map<string, number>();
  const kept: WeightedConceptEdge[] = [];
  for (const edge of sorted) {
    const ds = degree.get(edge.source) ?? 0;
    const dt = degree.get(edge.target) ?? 0;
    if (ds < k && dt < k) {
      kept.push(edge);
      degree.set(edge.source, ds + 1);
      degree.set(edge.target, dt + 1);
    }
  }
  return kept;
}

/**
 * Concept pairs both strictly above the median total co-occurrence weight
 * (over ALL concepts) with no direct edge in the full list — candidate
 * connections the corpus has not made yet.
 */
export function computeGaps(
  edges: readonly WeightedConceptEdge[],
  conceptSlugs: readonly string[],
): ConceptGap[] {
  const total = new Map<string, number>(conceptSlugs.map((s) => [s, 0]));
  for (const edge of edges) {
    total.set(edge.source, (total.get(edge.source) ?? 0) + edge.weight);
    total.set(edge.target, (total.get(edge.target) ?? 0) + edge.weight);
  }
  const values = conceptSlugs.map((s) => total.get(s)!).sort((a, b) => a - b);
  if (values.length === 0) return [];
  const mid = values.length / 2;
  const median = values.length % 2 === 1 ? values[Math.floor(mid)] : (values[mid - 1] + values[mid]) / 2;

  const heavy = conceptSlugs.filter((s) => total.get(s)! > median).sort();
  const connected = new Set(edges.map(edgeKey));
  const gaps: ConceptGap[] = [];
  for (let i = 0; i < heavy.length; i++) {
    for (let j = i + 1; j < heavy.length; j++) {
      if (connected.has(`${heavy[i]}~${heavy[j]}`)) continue;
      gaps.push({
        source: heavy[i],
        target: heavy[j],
        sourceWeight: total.get(heavy[i])!,
        targetWeight: total.get(heavy[j])!,
      });
    }
  }
  return gaps.sort(
    (a, b) =>
      b.sourceWeight + b.targetWeight - (a.sourceWeight + a.targetWeight) ||
      edgeKey(a).localeCompare(edgeKey(b)),
  );
}

export interface ConceptGraphInputs {
  concepts?: readonly ConceptEntry[];
  digests?: readonly DigestDoc[];
  explorers?: readonly Explorer[];
  assignments?: ConceptAssignments;
  topics?: ReadonlyMap<string, TopicMeta>;
  topK?: number;
}

/**
 * Compile the concept graph. With no inputs, reads the committed registry,
 * digest frontmatter, explorers.json, assignments, and topics. Every input
 * is injectable for fixture-driven tests.
 */
export function buildConceptGraph(inputs: ConceptGraphInputs = {}): ConceptGraphData {
  const concepts = inputs.concepts ?? loadConcepts();
  const digests = inputs.digests ?? loadDigestDocs();
  const explorers = inputs.explorers ?? loadExplorers();
  const assignments = inputs.assignments ?? loadConceptAssignments();
  const topics = inputs.topics ?? loadTopicMeta();
  const topK = inputs.topK ?? CONCEPT_EDGE_TOP_K;

  const { evidence, groups } = deriveConceptMembership({ concepts, digests, explorers, assignments });
  const conceptEdges = computeCooccurrenceEdges(groups);
  const rendered = capConceptEdges(conceptEdges, topK);
  const gaps = computeGaps(
    conceptEdges,
    concepts.map((c) => c.slug),
  );

  const nodes: ConceptGraphNode[] = [];
  const edges: GraphEdge[] = [];

  for (const concept of concepts) {
    const ev = evidence.get(concept.slug)!;
    const count = ev.digests.length + ev.sections.length + ev.papers.length + ev.vaultNotes.length;
    nodes.push({
      id: concept.slug,
      type: "concept",
      label: concept.label,
      summary: concept.definition,
      // R15 deep link: the explorer's detail panel renders node links, so
      // every concept node points at its static /concepts/<slug>/ page.
      links: [{ label: "Concept page", url: `/concepts/${concept.slug}/` }],
      weight: 1 + Math.min(count, 12) / 6,
      evidence: ev,
    });
    if (concept.topic !== undefined) {
      edges.push({
        id: `${concept.slug}~topic:${concept.topic}`,
        source: concept.slug,
        target: `topic:${concept.topic}`,
        kind: "concept-topic",
      });
    }
  }

  const anchorTopics = [...new Set(concepts.flatMap((c) => (c.topic !== undefined ? [c.topic] : [])))].sort();
  for (const topicId of anchorTopics) {
    const meta = topics.get(topicId);
    if (meta === undefined) {
      throw new Error(`concept topic anchor "${topicId}" not found in ${TOPICS_DIR}`);
    }
    nodes.push({
      id: `topic:${topicId}`,
      type: "topic",
      label: meta.title,
      summary: meta.summary,
      links: [],
      weight: meta.weight ?? 1,
    });
  }

  const vaultKeys = Object.keys(assignments)
    .filter((key) => key.startsWith("vault:"))
    .sort();
  for (const key of vaultKeys) {
    const assignment = assignments[key];
    const { id } = splitAssignmentKey(key);
    nodes.push({
      id: key,
      type: "vaultNote",
      label: id,
      summary: assignment.takeaway ?? "",
      links: [],
      weight: 1,
    });
    edges.push({ id: `${assignment.concept}~${key}`, source: assignment.concept, target: key, kind: "concept-note" });
  }

  for (const edge of rendered) {
    edges.push({ id: edgeKey(edge), source: edge.source, target: edge.target, kind: "concept-concept" });
  }

  return { nodes, edges, conceptEdges, gaps };
}
