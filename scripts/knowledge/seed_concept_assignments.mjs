#!/usr/bin/env node
/**
 * Deterministically seed src/data/knowledge/concept-assignments.json from
 * committed data. Safe to re-run: same inputs produce byte-identical output.
 *
 * Sources (immutable ids only — never section slugs or facet strings):
 *   - digest:<slug>   from src/content/digest/ frontmatter — the first
 *                     `topics` facet that alias-resolves to a concept wins.
 *   - paper:<bibcode> from src/data/knowledge/explorers.json — the first
 *                     paper branch whose section (key, then label) resolves
 *                     to a concept wins; the matching note's takeaway is
 *                     carried when present. First explorer to claim a
 *                     bibcode wins.
 *
 * No vault: or thread: entries are seeded; those key forms exist for later
 * curation. The vault itself is never read.
 */
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { parse } from "yaml";
import { canonicalConceptSlug } from "../../src/lib/knowledge/conceptAliases.ts";
import { CONCEPT_ASSIGNMENTS_PATH, parseConceptAssignments } from "../../src/lib/knowledge/conceptAssignments.ts";

const DIGEST_DIR = "src/content/digest";
const EXPLORERS_PATH = "src/data/knowledge/explorers.json";
const FRONTMATTER_RE = /^---\r?\n([\s\S]*?)\r?\n---/;

const outPath = process.argv[2] ?? CONCEPT_ASSIGNMENTS_PATH;
const assignments = {};

// ---- digest:<slug> — first alias-resolving `topics` facet wins ----
const digestFiles = readdirSync(DIGEST_DIR)
  .filter((f) => f.endsWith(".md") || f.endsWith(".mdx"))
  .sort();
for (const file of digestFiles) {
  const slug = file.replace(/\.(md|mdx)$/, "");
  const raw = readFileSync(join(DIGEST_DIR, file), "utf8");
  const match = raw.match(FRONTMATTER_RE);
  if (!match) throw new Error(`digest/${slug}: missing frontmatter block`);
  const fm = parse(match[1]);
  const topics = Array.isArray(fm.topics) ? fm.topics : [];
  for (const topic of topics) {
    const concept = canonicalConceptSlug(String(topic));
    if (concept !== null) {
      assignments[`digest:${slug}`] = { concept };
      break;
    }
  }
}

// ---- paper:<bibcode> — first branch whose section resolves wins ----
const { explorers } = JSON.parse(readFileSync(EXPLORERS_PATH, "utf8"));
for (const explorer of explorers) {
  const sectionsByKey = new Map(explorer.sections.map((s) => [s.key, s]));
  for (const paper of explorer.papers) {
    // Some explorer papers carry no bibcode (arxiv-only) — no immutable id
    // to key on, so they stay derived-membership-only until they get one.
    if (typeof paper.bibcode !== "string" || !paper.bibcode.trim()) continue;
    const key = `paper:${paper.bibcode}`;
    if (key in assignments) continue; // first explorer to claim a bibcode wins
    for (const branch of paper.branches ?? []) {
      const section = sectionsByKey.get(branch);
      if (!section) continue;
      const concept = canonicalConceptSlug(section.key) ?? canonicalConceptSlug(section.label);
      if (concept === null) continue;
      const note = (paper.notes ?? []).find((n) => n.branch === branch);
      assignments[key] =
        note && typeof note.takeaway === "string" && note.takeaway.trim()
          ? { concept, takeaway: note.takeaway }
          : { concept };
      break;
    }
  }
}

const sorted = Object.fromEntries(Object.entries(assignments).sort(([a], [b]) => (a < b ? -1 : 1)));
parseConceptAssignments(sorted); // never write a file the build-time schema rejects
writeFileSync(outPath, `${JSON.stringify(sorted, null, 2)}\n`);
console.log(`seeded ${Object.keys(sorted).length} assignments -> ${outPath}`);
