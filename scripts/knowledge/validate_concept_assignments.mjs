#!/usr/bin/env node
/**
 * Validation gate for src/data/knowledge/concept-assignments.json — wired
 * into `npm run check` and `npm run build` after validate-concepts.mjs.
 *
 * Fails the build on:
 *   - shape drift (Zod parse in src/lib/knowledge/conceptAssignments.ts:
 *     non-immutable-id keys, missing `concept`, unknown fields)
 *   - paper:<bibcode> not present in libraries.json or explorers.json
 *   - digest:<slug> with no entry in src/content/digest/
 *   - any `concept` value missing from src/content/concepts/
 *
 * thread:/vault: ids are validated for shape only — their referents live
 * outside this repo's committed data (the vault is never read).
 *
 * Usage: node scripts/knowledge/validate_concept_assignments.mjs [file]
 * (the optional file argument lets tests point it at fixtures)
 */
import { readdirSync, readFileSync } from "node:fs";
import { loadConcepts } from "../../src/lib/knowledge/conceptAliases.ts";
import {
  CONCEPT_ASSIGNMENTS_PATH,
  loadConceptAssignments,
  splitAssignmentKey,
} from "../../src/lib/knowledge/conceptAssignments.ts";

const DIGEST_DIR = "src/content/digest";
const LIBRARIES_PATH = "src/data/knowledge/libraries.json";
const EXPLORERS_PATH = "src/data/knowledge/explorers.json";

const filePath = process.argv[2] ?? CONCEPT_ASSIGNMENTS_PATH;

function fail(message) {
  console.error(`concept-assignments invalid: ${message}`);
  process.exit(1);
}

let assignments;
try {
  assignments = loadConceptAssignments(filePath);
} catch (error) {
  fail(error instanceof Error ? error.message : String(error));
}

const bibcodes = new Set();
for (const library of JSON.parse(readFileSync(LIBRARIES_PATH, "utf8")).libraries) {
  for (const paper of library.papers) bibcodes.add(paper.bibcode);
}
for (const explorer of JSON.parse(readFileSync(EXPLORERS_PATH, "utf8")).explorers) {
  for (const paper of explorer.papers) bibcodes.add(paper.bibcode);
}

const digestSlugs = new Set(
  readdirSync(DIGEST_DIR)
    .filter((f) => f.endsWith(".md") || f.endsWith(".mdx"))
    .map((f) => f.replace(/\.(md|mdx)$/, "")),
);
const conceptSlugs = new Set(loadConcepts().map((c) => c.slug));

for (const [key, assignment] of Object.entries(assignments)) {
  const { kind, id } = splitAssignmentKey(key);
  if (kind === "paper" && !bibcodes.has(id)) {
    fail(`${key}: bibcode not found in libraries.json or explorers.json`);
  }
  if (kind === "digest" && !digestSlugs.has(id)) {
    fail(`${key}: no such entry in ${DIGEST_DIR}`);
  }
  if (!conceptSlugs.has(assignment.concept)) {
    fail(`${key}: nonexistent concept slug "${assignment.concept}"`);
  }
}

console.log(`concept-assignments OK: ${Object.keys(assignments).length} entries in ${filePath}`);
