// Concept detail-panel model: turns a concept node's derived evidence into
// renderable link groups. Pure over its inputs (no DOM) so the same model
// drives the client detail panel AND the server-rendered no-JS fallback,
// and unit-tests under node --test.

import type { NodeType } from "../lib/graph/buildGraph";
import type { ConceptGraphNode } from "../lib/graph/buildConceptGraph";
import {
  formatFreshnessLine,
  type ConceptFreshness,
} from "../lib/knowledge/conceptFreshness.ts";

export interface PanelItem {
  label: string;
  /** Absent = plain text entry (papers without a URL, vault notes, threads). */
  href?: string;
  /** Secondary line: digest date, paper takeaway, note takeaway. */
  meta?: string;
  /** Node type the entry represents, for style-token lookups. */
  type?: NodeType;
}

export interface PanelGroup {
  heading: string;
  items: PanelItem[];
}

export interface ConceptPanel {
  /**
   * All-lane evidence summary, e.g. "tagged in 15 of 60 digest issues, most
   * recently 2026-07-04 · 18 papers · 1 explorer section". Digest freshness
   * leads when the concept is digest-tagged; for paper/explorer-lane concepts
   * with zero digest tags the richer lanes lead so the concept doesn't read
   * as dead. Null when there is neither freshness data nor evidence.
   */
  freshnessLine: string | null;
  groups: PanelGroup[];
}

function laneCount(n: number, singular: string, plural: string): string | null {
  if (n === 0) return null;
  return `${n} ${n === 1 ? singular : plural}`;
}

/** Non-digest lane counts ("18 papers", "1 explorer section", ...), zeros omitted. */
function laneParts(ev: ConceptGraphNode["evidence"]): string[] {
  if (ev === undefined) return [];
  return [
    laneCount(ev.papers.length, "paper", "papers"),
    laneCount(ev.sections.length, "explorer section", "explorer sections"),
    laneCount(ev.vaultNotes.length, "vault note", "vault notes"),
    laneCount(ev.threads.length, "thread", "threads"),
  ].filter((p): p is string => p !== null);
}

/** Compose the summary line: digest fragment first when tagged, last when zero. */
function evidenceSummaryLine(
  ev: ConceptGraphNode["evidence"],
  freshness?: ConceptFreshness,
): string | null {
  const lanes = laneParts(ev);
  if (freshness === undefined) return lanes.length > 0 ? lanes.join(" · ") : null;
  const digest = formatFreshnessLine(freshness);
  const parts = freshness.tagged > 0 ? [digest, ...lanes] : [...lanes, digest];
  return parts.join(" · ");
}

export const DIGEST_ROUTE_PREFIX = "/digest/";

/** Route for a digest issue's page. */
export function digestHref(slug: string): string {
  return `${DIGEST_ROUTE_PREFIX}${slug}/`;
}

/** Anchor into an explorer page's section (matches library/explorers/[id]). */
export function sectionHref(url: string, sectionKey: string): string {
  return `${url}#theme-${sectionKey}`;
}

/**
 * Build the detail-panel model for a concept node. Only groups with at least
 * one entry are emitted; a node without evidence yields zero groups.
 */
export function buildConceptPanel(
  node: Pick<ConceptGraphNode, "evidence">,
  freshness?: ConceptFreshness,
): ConceptPanel {
  const groups: PanelGroup[] = [];
  const ev = node.evidence;

  if (ev !== undefined) {
    if (ev.digests.length > 0) {
      groups.push({
        heading: "Digest issues",
        items: ev.digests.map((d) => ({
          label: d.title,
          href: digestHref(d.slug),
          meta: d.date ?? d.takeaway,
        })),
      });
    }
    if (ev.sections.length > 0) {
      groups.push({
        heading: "Explorer sections",
        items: ev.sections.map((s) => ({
          label: `${s.explorerTitle} — ${s.sectionLabel}`,
          ...(s.url !== undefined ? { href: sectionHref(s.url, s.sectionKey) } : {}),
        })),
      });
    }
    if (ev.papers.length > 0) {
      groups.push({
        heading: "Papers",
        items: ev.papers.map((p) => ({
          label: p.title ?? p.bibcode,
          ...(p.url !== undefined ? { href: p.url } : {}),
          ...(p.takeaway !== undefined ? { meta: p.takeaway } : {}),
        })),
      });
    }
    if (ev.vaultNotes.length > 0) {
      groups.push({
        heading: "Vault notes",
        items: ev.vaultNotes.map((n) => ({
          label: n.id,
          ...(n.takeaway !== undefined ? { meta: n.takeaway } : {}),
          type: "vaultNote" as const,
        })),
      });
    }
    if (ev.threads.length > 0) {
      groups.push({
        heading: "Threads",
        items: ev.threads.map((n) => ({
          label: n.id,
          ...(n.takeaway !== undefined ? { meta: n.takeaway } : {}),
        })),
      });
    }
  }

  return {
    freshnessLine: evidenceSummaryLine(ev, freshness),
    groups,
  };
}
