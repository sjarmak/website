// Minimal local evidence join for the concepts mirror.
//
// Joins the committed concept registry + concept-assignments.json against the
// digest collection, explorers.json, and threads.json to produce a
// per-concept evidence bundle. The build-concept-graph unit's shared helpers
// are not merged yet, so this is a deliberately small, deterministic join
// over the same committed sources (no network, no model calls).
//
// Every data path is injected — tests run this against synthetic fixtures.

import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import {
  buildConceptIndex,
  loadConcepts,
  normalizeFacet,
} from "../../../src/lib/knowledge/conceptAliases.ts";

export const SITE_BASE_URL = "https://www.sjarmak.ai";
export const ADS_ABS_URL = "https://ui.adsabs.harvard.edu/abs";

const FRONTMATTER_RE = /^---\r?\n([\s\S]*?)\r?\n---/;

async function readJson(filePath) {
  return JSON.parse(await readFile(filePath, "utf8"));
}

/** Digest slug -> title, read from digest collection frontmatter. */
async function loadDigestTitles(digestDir) {
  const titles = new Map();
  let files;
  try {
    files = await readdir(digestDir);
  } catch (err) {
    throw new Error(`digest dir ${digestDir} unreadable: ${err.code ?? err.message}`);
  }
  const { parse } = await import("yaml");
  for (const file of files.filter((f) => f.endsWith(".md") || f.endsWith(".mdx")).sort()) {
    const raw = await readFile(path.join(digestDir, file), "utf8");
    const match = raw.match(FRONTMATTER_RE);
    if (!match) continue;
    const fm = parse(match[1]) ?? {};
    const slug = file.replace(/\.(md|mdx)$/, "");
    if (typeof fm.title === "string" && fm.title.trim()) titles.set(slug, fm.title.trim());
  }
  return titles;
}

function emptyEvidence() {
  return { digests: [], papers: [], explorerSections: [], vaultNotes: [], threads: [] };
}

/**
 * Build the per-concept evidence bundles.
 *
 * @param {object} paths - explicit source paths (all required):
 *   conceptsDir, assignmentsPath, digestDir, explorersPath, threadsPath
 * @returns [{ slug, label, definition, evidence, count }] sorted by evidence
 *   count (desc), slug (asc) as the deterministic tiebreaker.
 */
export async function buildEvidence({ conceptsDir, assignmentsPath, digestDir, explorersPath, threadsPath }) {
  for (const [name, value] of Object.entries({ conceptsDir, assignmentsPath, digestDir, explorersPath, threadsPath })) {
    if (typeof value !== "string" || !value.trim()) throw new Error(`buildEvidence: ${name} path is required`);
  }

  const concepts = loadConcepts(conceptsDir);
  const conceptIndex = buildConceptIndex(concepts);
  const assignments = await readJson(assignmentsPath);
  const explorersData = await readJson(explorersPath);
  const threadsData = await readJson(threadsPath);
  const digestTitles = await loadDigestTitles(digestDir);

  const explorers = Array.isArray(explorersData.explorers) ? explorersData.explorers : [];
  const threads = Array.isArray(threadsData.threads) ? threadsData.threads : [];

  // Paper metadata by bibcode, from explorer membership (title + takeaways).
  const paperMeta = new Map();
  for (const explorer of explorers) {
    for (const paper of explorer.papers ?? []) {
      if (!paper.bibcode || paperMeta.has(paper.bibcode)) continue;
      paperMeta.set(paper.bibcode, {
        title: paper.title ?? paper.bibcode,
        takeaway: paper.notes?.[0]?.takeaway,
      });
    }
  }
  const threadMeta = new Map(threads.filter((t) => t.id).map((t) => [t.id, t]));

  const bySlug = new Map(
    concepts.map((c) => [c.slug, { slug: c.slug, label: c.label, definition: c.definition, evidence: emptyEvidence() }]),
  );

  for (const [key, assignment] of Object.entries(assignments)) {
    const bundle = bySlug.get(assignment.concept);
    if (!bundle) continue; // assignment to a concept outside this registry
    const match = key.match(/^(paper|digest|thread|vault):(.+)$/);
    if (!match) throw new Error(`invalid assignment key: ${JSON.stringify(key)}`);
    const [, kind, id] = match;
    if (kind === "digest") {
      bundle.evidence.digests.push({
        id,
        title: digestTitles.get(id) ?? id,
        url: `${SITE_BASE_URL}/digest/${id}`,
      });
    } else if (kind === "paper") {
      const meta = paperMeta.get(id);
      bundle.evidence.papers.push({
        id,
        title: meta?.title ?? id,
        url: `${ADS_ABS_URL}/${encodeURIComponent(id)}/abstract`,
        takeaway: assignment.takeaway ?? meta?.takeaway,
      });
    } else if (kind === "thread") {
      const meta = threadMeta.get(id);
      bundle.evidence.threads.push({
        id,
        title: meta?.question ?? meta?.title ?? id,
        url: `${SITE_BASE_URL}/library#${id}`,
      });
    } else {
      // vault:<id> — a note in her vault; rendered as a wikilink.
      bundle.evidence.vaultNotes.push({ id, target: id });
    }
  }

  // Explorer-section membership: a section (branch) whose normalized slug
  // resolves to a concept through the alias index is evidence for it.
  for (const explorer of explorers) {
    const branches = new Set();
    for (const paper of explorer.papers ?? []) {
      for (const branch of paper.branches ?? []) branches.add(branch);
    }
    for (const branch of [...branches].sort()) {
      const slug = conceptIndex.get(normalizeFacet(branch));
      const bundle = slug === undefined ? undefined : bySlug.get(slug);
      if (!bundle) continue;
      bundle.evidence.explorerSections.push({
        id: `${explorer.id}#${branch}`,
        title: `${explorer.title ?? explorer.id} — ${branch}`,
        url: `${SITE_BASE_URL}${explorer.homepage ?? `/library/explorers/${explorer.id}`}#${branch}`,
      });
    }
  }

  const bundles = [...bySlug.values()].map((bundle) => ({
    ...bundle,
    count: Object.values(bundle.evidence).reduce((n, list) => n + list.length, 0),
  }));
  // Deterministic ranking with an explicit tiebreaker (count desc, slug asc).
  bundles.sort((a, b) => b.count - a.count || a.slug.localeCompare(b.slug));
  for (const bundle of bundles) {
    for (const list of Object.values(bundle.evidence)) {
      list.sort((a, b) => String(a.id).localeCompare(String(b.id)));
    }
  }
  return bundles;
}

/** Top-N concepts by evidence count; concepts with zero evidence are omitted. */
export function topConcepts(bundles, n = 10) {
  if (!Number.isInteger(n) || n < 1) throw new Error(`top-n must be a positive integer, got ${n}`);
  return bundles.filter((b) => b.count > 0).slice(0, n);
}
