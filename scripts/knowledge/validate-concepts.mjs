#!/usr/bin/env node
/**
 * Cross-entry validation gate for the concepts registry — wired into
 * `npm run check` and `npm run build` (per-entry Zod in content.config.ts
 * cannot see sibling entries).
 *
 * Fails the build on:
 *   - duplicate alias/label/slug claims across concept entries
 *   - dangling `topic` references (must exist in src/content/topics)
 *   - dangling `related` references (must exist in src/content/concepts)
 *   - registry size outside the 30–50 seed contract
 */
import { readdirSync } from "node:fs";
import { buildConceptIndex, loadConcepts } from "../../src/lib/knowledge/conceptAliases.ts";

const MIN_ENTRIES = 30;
const MAX_ENTRIES = 50;
const TOPICS_DIR = "src/content/topics";

function fail(message) {
  console.error(`concepts registry invalid: ${message}`);
  process.exit(1);
}

let concepts;
try {
  concepts = loadConcepts();
  buildConceptIndex(concepts); // throws on cross-entry duplicate alias/label
} catch (error) {
  fail(error instanceof Error ? error.message : String(error));
}

if (concepts.length < MIN_ENTRIES || concepts.length > MAX_ENTRIES) {
  fail(`${concepts.length} entries — expected between ${MIN_ENTRIES} and ${MAX_ENTRIES}`);
}

const topicSlugs = new Set(
  readdirSync(TOPICS_DIR)
    .filter((f) => f.endsWith(".md") || f.endsWith(".mdx"))
    .map((f) => f.replace(/\.(md|mdx)$/, "")),
);
const conceptSlugs = new Set(concepts.map((c) => c.slug));

for (const concept of concepts) {
  if (concept.topic !== undefined && !topicSlugs.has(concept.topic)) {
    fail(`concepts/${concept.slug}: dangling topic reference "${concept.topic}"`);
  }
  for (const related of concept.related) {
    if (!conceptSlugs.has(related)) {
      fail(`concepts/${concept.slug}: dangling related reference "${related}"`);
    }
    if (related === concept.slug) {
      fail(`concepts/${concept.slug}: self reference in \`related\``);
    }
  }
}

console.log(`concepts registry OK: ${concepts.length} entries, cross-entry aliases unique`);
