#!/usr/bin/env node

import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const researchRoot = process.env.RELIABLE_AGENTS_RESEARCH_ROOT
  ?? path.resolve(path.dirname(root), "..", "agent_reliability/reference_context");
const catalogPath = path.join(researchRoot, "catalog_v2/catalog-final.json");
const outputPath = path.join(root, "artifacts/arxiv/practice-id-map.json");

let existing;
try {
  existing = JSON.parse(await readFile(outputPath, "utf8"));
} catch (error) {
  if (error.code !== "ENOENT") throw error;
}

const catalog = JSON.parse(await readFile(catalogPath, "utf8"));
if (catalog.length !== 192) throw new Error(`Expected 192 practices, found ${catalog.length}`);

const initialized = Object.fromEntries(catalog.map((practice, index) => [
  practice.id,
  `ERCA-${String(index + 1).padStart(3, "0")}`,
]));

if (existing) {
  const missing = catalog.filter((practice) => !existing[practice.id]).map((practice) => practice.id);
  const reused = Object.entries(existing).filter(([, displayId], index, entries) =>
    entries.findIndex(([, candidate]) => candidate === displayId) !== index);
  if (missing.length || reused.length) {
    throw new Error(`Stable practice-ID map is invalid: ${missing.length} missing, ${reused.length} reused`);
  }
  console.log(`Verified ${Object.keys(existing).length} stable practice IDs in ${outputPath}`);
  process.exit(0);
}

await writeFile(outputPath, `${JSON.stringify(initialized, null, 2)}\n`);
console.log(`Initialized ${Object.keys(initialized).length} stable practice IDs in ${outputPath}`);
