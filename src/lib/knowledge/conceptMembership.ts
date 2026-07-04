/**
 * Derived concept membership: joins current digest frontmatter facets and
 * explorer section themes through the concept alias table, and folds in the
 * immutable-id evidence from concept-assignments.json.
 *
 * Membership is ALWAYS derived at build time — nothing here writes, and no
 * explorer-section slug or digest facet string is ever persisted. Renaming an
 * explorer branch/section slug therefore changes zero committed bytes;
 * derived membership follows the rename through the alias table (section
 * `key` resolves first, then `label`).
 *
 * Reads fs + yaml (not astro:content) so the same module works inside the
 * Astro build, in node scripts, and under node --test. The vault-mirror unit
 * reuses `deriveConceptMembership` for per-concept evidence lists.
 */
import { readdirSync, readFileSync } from "node:fs";
import { basename, join } from "node:path";
import { parse } from "yaml";
import { buildConceptIndex, normalizeFacet, type ConceptEntry } from "./conceptAliases.ts";
import { splitAssignmentKey, type ConceptAssignments } from "./conceptAssignments.ts";

export const DIGEST_DIR = "src/content/digest";
export const EXPLORERS_PATH = "src/data/knowledge/explorers.json";

const FRONTMATTER_RE = /^---\r?\n([\s\S]*?)\r?\n---/;

/** A digest issue reduced to what membership needs: identity + facet strings. */
export interface DigestDoc {
  slug: string;
  title: string;
  /** ISO date (YYYY-MM-DD). */
  date: string;
  /** Frontmatter `topics` facet strings, verbatim. */
  facets: string[];
}

export interface ExplorerSection {
  key: string;
  label: string;
}

export interface ExplorerPaperNote {
  branch: string;
  takeaway?: string;
}

export interface ExplorerPaper {
  bibcode?: string | null;
  title?: string;
  year?: number;
  arxiv?: string | null;
  url?: string | null;
  branches?: string[];
  notes?: ExplorerPaperNote[];
}

export interface Explorer {
  id: string;
  title: string;
  homepage?: string;
  sections: ExplorerSection[];
  papers: ExplorerPaper[];
}

// ---- evidence attached to each concept (consumed by the detail panel) ----

export interface DigestEvidence {
  slug: string;
  title: string;
  date?: string;
  takeaway?: string;
}

export interface SectionEvidence {
  explorerId: string;
  explorerTitle: string;
  sectionKey: string;
  sectionLabel: string;
  url?: string;
}

export interface PaperEvidence {
  bibcode: string;
  title?: string;
  year?: number;
  url?: string;
  takeaway?: string;
}

export interface NoteEvidence {
  id: string;
  takeaway?: string;
}

export interface ConceptEvidence {
  digests: DigestEvidence[];
  sections: SectionEvidence[];
  papers: PaperEvidence[];
  vaultNotes: NoteEvidence[];
  threads: NoteEvidence[];
}

/** One co-occurrence context: the concepts a single digest or paper spans. */
export interface CooccurrenceGroup {
  kind: "digest" | "paper";
  /** Provenance id: digest slug, or paper bibcode / arxiv id. */
  id: string;
  /** Two or more distinct concept slugs, sorted. */
  concepts: string[];
}

export interface MembershipInputs {
  concepts: readonly ConceptEntry[];
  digests: readonly DigestDoc[];
  explorers: readonly Explorer[];
  assignments: ConceptAssignments;
}

export interface DerivedMembership {
  /** Concept slug -> evidence lists. Every concept has an entry. */
  evidence: Map<string, ConceptEvidence>;
  /** Co-occurrence contexts for the graph's concept<->concept edges. */
  groups: CooccurrenceGroup[];
}

/** Parse a Markdown file's YAML frontmatter block. Throws when absent. */
export function parseFrontmatterBlock(raw: string, context: string): Record<string, unknown> {
  const match = raw.match(FRONTMATTER_RE);
  if (!match) throw new Error(`${context}: missing frontmatter block`);
  return parse(match[1]) as Record<string, unknown>;
}

/** Load digest issues (slug, title, date, `topics` facets) from frontmatter. */
export function loadDigestDocs(dir: string = DIGEST_DIR): DigestDoc[] {
  const files = readdirSync(dir)
    .filter((f) => f.endsWith(".md") || f.endsWith(".mdx"))
    .sort();
  return files.map((file) => {
    const slug = basename(file).replace(/\.(md|mdx)$/, "");
    const fm = parseFrontmatterBlock(readFileSync(join(dir, file), "utf8"), `digest/${slug}`);
    if (typeof fm.title !== "string" || !fm.title.trim()) {
      throw new Error(`digest/${slug}: \`title\` is required`);
    }
    const facets = Array.isArray(fm.topics) ? fm.topics.map((t) => String(t)) : [];
    const date = fm.date instanceof Date ? fm.date.toISOString().slice(0, 10) : String(fm.date ?? "");
    if (!date) throw new Error(`digest/${slug}: \`date\` is required`);
    return { slug, title: fm.title, date, facets };
  });
}

/** Load + structurally validate the committed explorers file. */
export function loadExplorers(path: string = EXPLORERS_PATH): Explorer[] {
  const data = JSON.parse(readFileSync(path, "utf8")) as { explorers?: unknown };
  if (!Array.isArray(data.explorers)) {
    throw new Error(`${path}: \`explorers\` must be an array`);
  }
  return data.explorers.map((explorer: Explorer) => {
    if (typeof explorer.id !== "string" || !explorer.id) throw new Error(`${path}: explorer without an id`);
    if (typeof explorer.title !== "string") throw new Error(`${path}: ${explorer.id}: missing title`);
    if (!Array.isArray(explorer.sections)) throw new Error(`${path}: ${explorer.id}: \`sections\` must be an array`);
    if (!Array.isArray(explorer.papers)) throw new Error(`${path}: ${explorer.id}: \`papers\` must be an array`);
    for (const section of explorer.sections) {
      if (typeof section.key !== "string" || typeof section.label !== "string") {
        throw new Error(`${path}: ${explorer.id}: section without key/label`);
      }
    }
    return explorer;
  });
}

/** Resolve a section to a concept slug: `key` first, then `label`. */
export function resolveSectionConcept(
  section: ExplorerSection,
  resolve: (facet: string) => string | null,
): string | null {
  return resolve(section.key) ?? resolve(section.label);
}

function paperGroupId(paper: ExplorerPaper, explorer: Explorer, index: number): string {
  if (typeof paper.bibcode === "string" && paper.bibcode.trim()) return paper.bibcode;
  if (typeof paper.arxiv === "string" && paper.arxiv.trim()) return `arxiv:${paper.arxiv}`;
  return `${explorer.id}#${index}`;
}

function paperUrl(paper: ExplorerPaper | undefined): string | undefined {
  if (!paper) return undefined;
  if (typeof paper.url === "string" && paper.url) return paper.url;
  if (typeof paper.arxiv === "string" && paper.arxiv) return `https://arxiv.org/abs/${paper.arxiv}`;
  return undefined;
}

const byId = (a: NoteEvidence, b: NoteEvidence) => a.id.localeCompare(b.id);

/**
 * The derived-membership join. Digest facets and explorer sections resolve
 * through the alias index built from `concepts`; assignments contribute
 * immutable-id evidence (and takeaways) on top. Pure over its inputs.
 */
export function deriveConceptMembership(inputs: MembershipInputs): DerivedMembership {
  const index = buildConceptIndex(inputs.concepts);
  const resolve = (facet: string): string | null => index.get(normalizeFacet(facet)) ?? null;

  const evidence = new Map<string, ConceptEvidence>();
  for (const concept of inputs.concepts) {
    evidence.set(concept.slug, { digests: [], sections: [], papers: [], vaultNotes: [], threads: [] });
  }
  const groups: CooccurrenceGroup[] = [];

  // ---- digest facets -> digest evidence + one group per issue ----
  for (const digest of inputs.digests) {
    const resolved = new Set<string>();
    for (const facet of digest.facets) {
      const slug = resolve(facet);
      if (slug !== null) resolved.add(slug);
    }
    for (const slug of resolved) {
      evidence.get(slug)!.digests.push({ slug: digest.slug, title: digest.title, date: digest.date });
    }
    if (resolved.size >= 2) {
      groups.push({ kind: "digest", id: digest.slug, concepts: [...resolved].sort() });
    }
  }

  // ---- explorer sections -> section evidence; papers -> one group each ----
  const papersByBibcode = new Map<string, ExplorerPaper>();
  for (const explorer of inputs.explorers) {
    const sectionConcept = new Map<string, string>();
    for (const section of explorer.sections) {
      const slug = resolveSectionConcept(section, resolve);
      if (slug === null) continue;
      sectionConcept.set(section.key, slug);
      evidence.get(slug)!.sections.push({
        explorerId: explorer.id,
        explorerTitle: explorer.title,
        sectionKey: section.key,
        sectionLabel: section.label,
        url: explorer.homepage,
      });
    }
    explorer.papers.forEach((paper, i) => {
      if (typeof paper.bibcode === "string" && paper.bibcode.trim() && !papersByBibcode.has(paper.bibcode)) {
        papersByBibcode.set(paper.bibcode, paper);
      }
      const resolved = new Set<string>();
      for (const branch of paper.branches ?? []) {
        const slug = sectionConcept.get(branch);
        if (slug !== undefined) resolved.add(slug);
      }
      if (resolved.size >= 2) {
        groups.push({ kind: "paper", id: paperGroupId(paper, explorer, i), concepts: [...resolved].sort() });
      }
    });
  }

  // ---- assignments: immutable-id evidence (digest takeaways, papers, vault, threads) ----
  for (const [key, assignment] of Object.entries(inputs.assignments)) {
    const target = evidence.get(assignment.concept);
    if (target === undefined) {
      throw new Error(`concept-assignments: ${key} references unknown concept "${assignment.concept}"`);
    }
    const { kind, id } = splitAssignmentKey(key);
    if (kind === "digest") {
      const existing = target.digests.find((d) => d.slug === id);
      if (existing !== undefined) {
        if (assignment.takeaway !== undefined) existing.takeaway = assignment.takeaway;
      } else {
        const doc = inputs.digests.find((d) => d.slug === id);
        target.digests.push({ slug: id, title: doc?.title ?? id, date: doc?.date, takeaway: assignment.takeaway });
      }
    } else if (kind === "paper") {
      const meta = papersByBibcode.get(id);
      target.papers.push({
        bibcode: id,
        title: meta?.title,
        year: meta?.year,
        url: paperUrl(meta),
        takeaway: assignment.takeaway,
      });
    } else if (kind === "vault") {
      target.vaultNotes.push({ id, takeaway: assignment.takeaway });
    } else {
      target.threads.push({ id, takeaway: assignment.takeaway });
    }
  }

  // ---- deterministic ordering for stable emitted data ----
  for (const ev of evidence.values()) {
    ev.digests.sort((a, b) => (b.date ?? "").localeCompare(a.date ?? "") || a.slug.localeCompare(b.slug));
    ev.sections.sort(
      (a, b) => a.explorerId.localeCompare(b.explorerId) || a.sectionKey.localeCompare(b.sectionKey),
    );
    ev.papers.sort((a, b) => a.bibcode.localeCompare(b.bibcode));
    ev.vaultNotes.sort(byId);
    ev.threads.sort(byId);
  }

  return { evidence, groups };
}
