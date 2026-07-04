// Shared plumbing for the concepts backfill pipeline (concepts_prep /
// concepts_assign / concepts_validate). Mechanical only — no model judgment
// lives here (ZFC: the LLM stage owns all semantic decisions).

import { readFile, readdir, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { parse as parseYaml } from "yaml";
import { buildConceptIndex, loadConcepts, normalizeFacet } from "../../src/lib/knowledge/conceptAliases.ts";

const MODULE_DIR = path.dirname(fileURLToPath(import.meta.url));
export const REPO_ROOT = path.resolve(MODULE_DIR, "..", "..");

// Clean no-op exit code — matches sync_candidates.py ("nothing to consider"),
// which sync-knowledge.sh treats as a skip, not a failure.
export const EXIT_NOOP = 3;

export const DEFAULT_DIGEST_DIR = path.join(REPO_ROOT, "src", "content", "digest");
export const DEFAULT_DATA_DIR = path.join(REPO_ROOT, "src", "data", "knowledge");
export const DEFAULT_CONCEPTS_DIR = path.join(REPO_ROOT, "src", "content", "concepts");

// Pipeline-home file names (state/ holds machine state, review/ holds
// human-facing proposals — see scripts/concepts/lib/pipeline-home.mjs).
export const CANDIDATES_FILENAME = "backfill-candidates.json";
export const ASSIGNMENTS_FILENAME = "backfill-assignments.json";

// Immutable-id source kinds (PRD: committed data holds only immutable ids).
// Explorer section keys are a daily-rewritten identifier space, so explorer
// sources may inform proposals but never become stored assignments.
export const ASSIGNABLE_KINDS = new Set(["digest", "thread"]);

const FRONTMATTER_RE = /^---\r?\n([\s\S]*?)\r?\n---/;

export function parseFrontmatter(raw, context) {
  const match = raw.match(FRONTMATTER_RE);
  if (!match) throw new Error(`${context}: missing frontmatter block`);
  const fm = parseYaml(match[1]);
  if (typeof fm !== "object" || fm === null) {
    throw new Error(`${context}: frontmatter is not a mapping`);
  }
  return fm;
}

export async function readJson(filePath) {
  const text = await readFile(filePath, "utf8");
  try {
    return JSON.parse(text);
  } catch (err) {
    throw new Error(`${filePath}: malformed JSON (${err.message})`);
  }
}

export async function writeJson(filePath, value) {
  await writeFile(filePath, JSON.stringify(value, null, 2) + "\n", "utf8");
}

function requireStringArray(value, context) {
  if (!Array.isArray(value) || value.some((v) => typeof v !== "string")) {
    throw new Error(`${context}: expected an array of strings`);
  }
  return value;
}

// Facet occurrences from digest frontmatter `topics` arrays.
async function digestOccurrences(digestDir) {
  const files = (await readdir(digestDir)).filter((f) => f.endsWith(".md") || f.endsWith(".mdx")).sort();
  const occurrences = [];
  for (const file of files) {
    const slug = file.replace(/\.(md|mdx)$/, "");
    const fm = parseFrontmatter(await readFile(path.join(digestDir, file), "utf8"), `digest/${file}`);
    if (fm.topics === undefined) continue;
    for (const raw of requireStringArray(fm.topics, `digest/${file}: topics`)) {
      occurrences.push({ raw, kind: "digest", id: slug });
    }
  }
  return occurrences;
}

// Facet occurrences from threads.json `concepts` arrays.
async function threadOccurrences(dataDir) {
  const data = await readJson(path.join(dataDir, "threads.json"));
  if (!Array.isArray(data.threads)) throw new Error("threads.json: `threads` must be an array");
  const occurrences = [];
  for (const thread of data.threads) {
    if (typeof thread.id !== "string" || !thread.id) throw new Error("threads.json: thread without an id");
    for (const raw of requireStringArray(thread.concepts ?? [], `threads.json: ${thread.id}.concepts`)) {
      occurrences.push({ raw, kind: "thread", id: thread.id });
    }
  }
  return occurrences;
}

// Facet occurrences from explorer section themes (section labels).
async function explorerOccurrences(dataDir) {
  const data = await readJson(path.join(dataDir, "explorers.json"));
  if (!Array.isArray(data.explorers)) throw new Error("explorers.json: `explorers` must be an array");
  const occurrences = [];
  for (const explorer of data.explorers) {
    if (typeof explorer.id !== "string" || !explorer.id) throw new Error("explorers.json: explorer without an id");
    for (const section of explorer.sections ?? []) {
      if (typeof section.label !== "string" || !section.label) {
        throw new Error(`explorers.json: ${explorer.id}: section without a label`);
      }
      occurrences.push({ raw: section.label, kind: "explorer", id: `${explorer.id}#${section.key ?? ""}` });
    }
  }
  return occurrences;
}

// Deterministic candidate collection: every facet across the three sources,
// alias-resolved against the registry; unresolved facets become candidates
// grouped by normalized form. Pure reads — never writes.
export async function collectCandidates({ digestDir, dataDir, conceptsDir }) {
  const index = buildConceptIndex(loadConcepts(conceptsDir));
  const occurrences = [
    ...(await digestOccurrences(digestDir)),
    ...(await threadOccurrences(dataDir)),
    ...(await explorerOccurrences(dataDir)),
  ];

  const groups = new Map();
  let facetsResolved = 0;
  const seen = new Set();
  for (const occ of occurrences) {
    const facet = normalizeFacet(occ.raw);
    if (!facet) throw new Error(`${occ.kind}:${occ.id}: facet ${JSON.stringify(occ.raw)} normalizes to empty`);
    if (!seen.has(facet)) {
      seen.add(facet);
      if (index.has(facet)) facetsResolved += 1;
    }
    if (index.has(facet)) continue;
    const group = groups.get(facet) ?? { facet, variants: [], sources: [] };
    if (!group.variants.includes(occ.raw)) group.variants.push(occ.raw);
    if (!group.sources.some((s) => s.kind === occ.kind && s.id === occ.id)) {
      group.sources.push({ kind: occ.kind, id: occ.id });
    }
    groups.set(facet, group);
  }

  return {
    stats: { facetsSeen: seen.size, facetsResolved },
    candidates: [...groups.values()].sort((a, b) => a.facet.localeCompare(b.facet)),
  };
}
