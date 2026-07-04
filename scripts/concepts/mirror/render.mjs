// Deterministic note rendering for mirrored concepts.
//
// Everything the mirror generates lives BETWEEN the managed-region markers;
// the space outside them (and any frontmatter keys the mirror does not own)
// belongs to the human and is preserved verbatim on regeneration.

import { stringify as yamlStringify } from "yaml";
import { REGION_BEGIN, REGION_END, contentHash } from "./normalize.mjs";

export const MANAGED_BY_TAG = "sjarmak-ai/concepts-mirror";
export const MANAGED_FRONTMATTER_KEYS = ["title", "type", "tags", "concept-id", "updated", "content-hash"];

const SECTION_ORDER = [
  ["digests", "Digest coverage"],
  ["papers", "Papers"],
  ["explorerSections", "Explorer sections"],
  ["threads", "Threads"],
  ["vaultNotes", "Vault notes"],
];

function bullet(kind, item) {
  if (kind === "vaultNotes") return `- [[${item.target}]]`;
  const link = `- [${item.title}](${item.url})`;
  return item.takeaway ? `${link} — ${item.takeaway}` : link;
}

/** Closing synthesis line: mechanical summary of the evidence footprint. */
export function synthesisLine(bundle) {
  const parts = SECTION_ORDER.filter(([key]) => bundle.evidence[key].length > 0).map(
    ([key, heading]) => `${bundle.evidence[key].length} ${heading.toLowerCase()}`,
  );
  return `_${bundle.label}: ${bundle.count} evidence item${bundle.count === 1 ? "" : "s"} (${parts.join(", ")})._`;
}

/** Render the managed-region body (no markers) for one concept bundle. */
export function renderManagedRegion(bundle) {
  const lines = [`> ${bundle.definition}`, ""];
  for (const [key, heading] of SECTION_ORDER) {
    const items = bundle.evidence[key];
    if (items.length === 0) continue;
    lines.push(`## ${heading}`, "");
    for (const item of items) lines.push(bullet(key, item));
    lines.push("");
  }
  lines.push(synthesisLine(bundle));
  return lines.join("\n");
}

/** Filename (basename with .md) for a concept's mirrored note. */
export function noteFilename(bundle) {
  return `${bundle.label.replace(/[\\/:]/g, "-")}.md`;
}

/** Managed frontmatter for one bundle. `updated` is caller-supplied. */
export function renderFrontmatter(bundle, { updated, managedRegion }) {
  return {
    title: bundle.label,
    type: "concept",
    tags: ["concept", MANAGED_BY_TAG],
    "concept-id": bundle.slug,
    updated,
    "content-hash": contentHash(managedRegion),
  };
}

/** Render a complete NEW note (no prior annotation space). */
export function renderNote(bundle, { updated }) {
  const managed = renderManagedRegion(bundle);
  const frontmatter = renderFrontmatter(bundle, { updated, managedRegion: managed });
  return `---\n${yamlStringify(frontmatter).trimEnd()}\n---\n\n${REGION_BEGIN}\n${managed}\n${REGION_END}\n`;
}
