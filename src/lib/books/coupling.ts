import commonCausesData from "@/data/books/engineering-reliable-coding-agents/coupling/common-causes.json";
import experimentBacklogData from "@/data/books/engineering-reliable-coding-agents/coupling/experiment-backlog.json";
import graphData from "@/data/books/engineering-reliable-coding-agents/coupling/coupling-graph.json";
import manifestData from "@/data/books/engineering-reliable-coding-agents/coupling/manifest.json";
import matrixData from "@/data/books/engineering-reliable-coding-agents/coupling/coupling-matrix.json";
import releaseData from "@/data/books/engineering-reliable-coding-agents/coupling/release.json";

export type LayerId =
  | "measurement"
  | "grading"
  | "containment_and_recovery"
  | "retrieval_and_context"
  | "review_and_accountability"
  | "allocation_and_cost";

type EvidenceGrade = "observed" | "derived" | "hypothesized";

interface MatrixCell {
  source_layer: LayerId;
  target_layer: LayerId;
  supported_edges: number;
  supported_practices: number;
  hypothesized_edges: number;
  all_candidate_edges: number;
  supported_by_coupling_type: Partial<Record<string, number>>;
  supported_by_evidence_grade: Partial<Record<EvidenceGrade, number>>;
}

interface CouplingEdge {
  source: LayerId;
  target: LayerId;
  weight_supported_practices: number;
  supported_edge_count: number;
  coupling_type_breakdown: Partial<Record<string, number>>;
  evidence_quality_breakdown: Partial<Record<EvidenceGrade, number>>;
}

export const couplingRelease = releaseData;
export const couplingManifest = manifestData;
const layerIds = new Set<string>([
  "measurement",
  "grading",
  "containment_and_recovery",
  "retrieval_and_context",
  "review_and_accountability",
  "allocation_and_cost",
]);

function asLayerId(value: string): LayerId {
  if (!layerIds.has(value)) throw new Error(`Unknown coupling layer: ${value}`);
  return value as LayerId;
}

export const couplingGraph: {
  nodes: Array<{ id: LayerId; label: string; order: number }>;
  edges: CouplingEdge[];
  weight_definition: string;
} = {
  weight_definition: graphData.weight_definition,
  nodes: graphData.nodes.map((node) => ({ ...node, id: asLayerId(node.id) })),
  edges: graphData.edges.map((edge) => ({
    ...edge,
    source: asLayerId(edge.source),
    target: asLayerId(edge.target),
  })),
};
export const commonCauses = commonCausesData;
export const experimentBacklog = experimentBacklogData;

export const layers = couplingGraph.nodes.toSorted((left, right) => left.order - right.order);

const matrix: { cells: MatrixCell[]; supported_definition: string } = {
  supported_definition: matrixData.supported_definition,
  cells: matrixData.cells.map((cell) => ({
    ...cell,
    source_layer: asLayerId(cell.source_layer),
    target_layer: asLayerId(cell.target_layer),
  })),
};
const cellIndex = new Map(
  matrix.cells.map((cell) => [`${cell.source_layer}:${cell.target_layer}`, cell]),
);

export const matrixRows = layers.map((source) => ({
  source,
  cells: layers.map((target) => {
    const cell = cellIndex.get(`${source.id}:${target.id}`);
    if (!cell) throw new Error(`Missing coupling matrix cell ${source.id}:${target.id}`);
    return cell;
  }),
}));

export const couplingSummary = Object.freeze({
  recordCount: couplingManifest.record_count,
  recordsWithSupportedEdges: couplingRelease.recordsWithSupportedEdges,
  noneObservedRecords: couplingRelease.noneObservedRecords,
  candidateEdges: couplingManifest.causal_edge_count,
  supportedEdges: couplingManifest.supported_edge_count,
  hypothesizedEdges: couplingManifest.hypothesized_edge_count,
  observedEdges: couplingGraph.edges.reduce(
    (sum, edge) => sum + (edge.evidence_quality_breakdown.observed ?? 0),
    0,
  ),
  nonDownstreamSupportedEdges: couplingGraph.edges.reduce(
    (sum, edge) =>
      sum +
      Object.entries(edge.coupling_type_breakdown)
        .filter(([couplingType]) => couplingType !== "downstream_propagation")
        .reduce((edgeSum, [, count]) => edgeSum + (count ?? 0), 0),
    0,
  ),
  reviewItems: couplingManifest.review_queue_count,
});

export function layerLabel(layer: string): string {
  return couplingGraph.nodes.find((node) => node.id === layer)?.label ?? humanize(layer);
}

export function humanize(value: string): string {
  const words = value.replaceAll("_", " ").replaceAll("-", " ");
  return `${words.charAt(0).toUpperCase()}${words.slice(1)}`;
}

export function evidenceBreakdown(breakdown: Partial<Record<EvidenceGrade, number>>): string {
  return (["observed", "derived", "hypothesized"] as const)
    .filter((grade) => (breakdown[grade] ?? 0) > 0)
    .map((grade) => `${breakdown[grade]} ${grade}`)
    .join(", ");
}

const SOURCE_ROOT = `https://github.com/sjarmak/engineering-reliable-coding-agents/blob/${couplingRelease.sourceCommit}/companion/coupling`;

export function couplingArtifactHref(filename: string): string {
  return `${SOURCE_ROOT}/${filename}`;
}
