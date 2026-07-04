// Local evidence view (Obsidian-style local graph) for the concepts explorer:
// maps a selected concept node's embedded evidence lists into satellite
// node/edge element specs, plus the deterministic ring-placement math.
// Pure over its inputs (no DOM, no Cytoscape instance) so it unit-tests under
// node --test; graph-explorer.ts consumes it additively.

import type { ElementDefinition } from "cytoscape";
import type { NodeType } from "../lib/graph/buildGraph";
import type { ConceptGraphNode } from "../lib/graph/buildConceptGraph";
import { digestHref, sectionHref } from "./concept-panel.ts";
import { colorFor, type Tokens } from "./graph-style.ts";

/** Every satellite element id starts with this prefix (batch add/remove). */
export const EVIDENCE_ID_PREFIX = "ev:";

/** Satellite budget per concept; beyond it one overflow node stands in. */
export const EVIDENCE_SATELLITE_CAP = 60;

/** Satellite labels are truncated to roughly this many characters. */
export const SATELLITE_LABEL_MAX = 40;

/** Rendered diameter of a satellite node (concept nodes start at 26). */
export const SATELLITE_SIZE = 14;

/**
 * Pseudo-type of the inert "+N more in panel" node. Not a NodeType: it must
 * never match a filter chip or a shape rule; colorFor resolves it through
 * its output fallback (the same color the theme-restyle pass re-derives).
 */
export const OVERFLOW_TYPE = "evidenceOverflow";

export interface EvidenceNodeSpec {
  id: string;
  type: NodeType | typeof OVERFLOW_TYPE;
  label: string;
  /** Absent = inert satellite (papers without a URL, vault notes, threads). */
  href?: string;
}

export interface EvidenceEdgeSpec {
  id: string;
  source: string;
  target: string;
  kind: "concept-evidence";
}

export interface EvidenceSpecs {
  nodes: EvidenceNodeSpec[];
  edges: EvidenceEdgeSpec[];
}

export function truncateLabel(text: string, max: number = SATELLITE_LABEL_MAX): string {
  if (text.length <= max) return text;
  return `${text.slice(0, max - 1).trimEnd()}…`;
}

/**
 * Map a concept node's evidence to satellite element specs, panel order
 * (digests, sections, papers, vault notes, threads), capped at `cap` with a
 * trailing "+N more in panel" overflow node when exceeded. A node without
 * evidence (every node on /projects/explorer) yields zero elements.
 */
export function buildEvidenceSpecs(
  node: Pick<ConceptGraphNode, "id" | "evidence">,
  cap: number = EVIDENCE_SATELLITE_CAP,
): EvidenceSpecs {
  const ev = node.evidence;
  if (ev === undefined) return { nodes: [], edges: [] };

  const satellites: EvidenceNodeSpec[] = [
    ...ev.digests.map(
      (d): EvidenceNodeSpec => ({
        id: `${EVIDENCE_ID_PREFIX}digest:${d.slug}`,
        type: "digest",
        label: truncateLabel(d.title),
        href: digestHref(d.slug),
      }),
    ),
    ...ev.sections.map(
      (s): EvidenceNodeSpec => ({
        id: `${EVIDENCE_ID_PREFIX}section:${s.explorerId}:${s.sectionKey}`,
        type: "section",
        label: truncateLabel(`${s.explorerTitle} — ${s.sectionLabel}`),
        ...(s.url !== undefined ? { href: sectionHref(s.url, s.sectionKey) } : {}),
      }),
    ),
    ...ev.papers.map(
      (p): EvidenceNodeSpec => ({
        id: `${EVIDENCE_ID_PREFIX}paper:${p.bibcode}`,
        type: "paper",
        label: truncateLabel(p.title ?? p.bibcode),
        ...(p.url !== undefined ? { href: p.url } : {}),
      }),
    ),
    ...ev.vaultNotes.map(
      (v): EvidenceNodeSpec => ({
        id: `${EVIDENCE_ID_PREFIX}note:${v.id}`,
        type: "vaultNote",
        label: truncateLabel(v.id),
      }),
    ),
    ...ev.threads.map(
      (t): EvidenceNodeSpec => ({
        id: `${EVIDENCE_ID_PREFIX}thread:${t.id}`,
        type: "vaultNote",
        label: truncateLabel(t.id),
      }),
    ),
  ];

  const nodes = satellites.slice(0, cap);
  if (satellites.length > cap) {
    nodes.push({
      id: `${EVIDENCE_ID_PREFIX}overflow:${node.id}`,
      type: OVERFLOW_TYPE,
      label: `+${satellites.length - cap} more in panel`,
    });
  }
  const edges = nodes.map(
    (sat): EvidenceEdgeSpec => ({
      id: `${EVIDENCE_ID_PREFIX}edge:${sat.id.slice(EVIDENCE_ID_PREFIX.length)}`,
      source: node.id,
      target: sat.id,
      kind: "concept-evidence",
    }),
  );
  return { nodes, edges };
}

/** Per-ring satellite capacity, innermost first (cumulative 84 > cap + overflow). */
export const RING_CAPACITIES = [12, 18, 24, 30];
export const RING_BASE_RADIUS = 90;
export const RING_SPACING = 60;

/**
 * Deterministic position offset for satellite `index` of `total` around a
 * center: concentric rings, each spread evenly over the full circle, with a
 * small per-ring angular stagger so rings don't align radially. Chord spacing
 * stays well above SATELLITE_SIZE for every ring at capacity.
 */
export function ringPlacement(index: number, total: number): { dx: number; dy: number } {
  let ring = 0;
  let start = 0;
  let capacity = RING_CAPACITIES[0];
  while (index >= start + capacity) {
    start += capacity;
    ring += 1;
    capacity = RING_CAPACITIES[ring] ?? RING_CAPACITIES[RING_CAPACITIES.length - 1];
  }
  const inRing = Math.min(total - start, capacity);
  const radius = RING_BASE_RADIUS + ring * RING_SPACING;
  const angle = -Math.PI / 2 + ring * (Math.PI / 12) + ((index - start) / inRing) * 2 * Math.PI;
  return { dx: radius * Math.cos(angle), dy: radius * Math.sin(angle) };
}

/**
 * Cytoscape elements for the specs, ring-placed around `center`. Satellites
 * are unselectable: a tap either navigates (href present) or is inert.
 */
export function evidenceElements(
  specs: EvidenceSpecs,
  center: { x: number; y: number },
  t: Tokens,
): ElementDefinition[] {
  const nodes = specs.nodes.map((spec, i): ElementDefinition => {
    const { dx, dy } = ringPlacement(i, specs.nodes.length);
    return {
      data: {
        id: spec.id,
        label: spec.label,
        type: spec.type,
        color: colorFor(spec.type as NodeType, t),
        size: SATELLITE_SIZE,
        ...(spec.href !== undefined ? { href: spec.href } : {}),
      },
      position: { x: center.x + dx, y: center.y + dy },
      selectable: false,
    };
  });
  const edges = specs.edges.map((e): ElementDefinition => ({ data: { ...e } }));
  return [...nodes, ...edges];
}
