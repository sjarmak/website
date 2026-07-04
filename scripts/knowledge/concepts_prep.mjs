#!/usr/bin/env node
// Stage 1 of the concepts backfill: deterministic candidate collection.
// On-demand and unscheduled — no cron path invokes this.
//
// Collects digest topic facets, explorer section themes, and thread concepts
// that do NOT alias-resolve to any registry concept, and writes them to the
// pipeline home (state/backfill-candidates.json). No model judgment here —
// canonicalization is concepts_assign.mjs's job (ZFC).
//
// Exit codes (matches sync_candidates.py):
//   0  candidates written
//   3  clean no-op — no unresolved facets, or no new candidates vs last run
//
// Usage:
//   node scripts/knowledge/concepts_prep.mjs [--digest-dir D] [--data-dir D] [--concepts-dir D]
//
// Env: CONCEPTS_PIPELINE_HOME (see scripts/concepts/lib/pipeline-home.mjs).

import path from "node:path";
import { parseArgs } from "node:util";
import { ensurePipelineHome } from "../concepts/lib/pipeline-home.mjs";
import {
  CANDIDATES_FILENAME,
  DEFAULT_CONCEPTS_DIR,
  DEFAULT_DATA_DIR,
  DEFAULT_DIGEST_DIR,
  EXIT_NOOP,
  collectCandidates,
  readJson,
  writeJson,
} from "./concepts_common.mjs";

async function main() {
  const { values } = parseArgs({
    options: {
      "digest-dir": { type: "string", default: DEFAULT_DIGEST_DIR },
      "data-dir": { type: "string", default: DEFAULT_DATA_DIR },
      "concepts-dir": { type: "string", default: DEFAULT_CONCEPTS_DIR },
    },
  });

  const home = await ensurePipelineHome();
  const { stats, candidates } = await collectCandidates({
    digestDir: values["digest-dir"],
    dataDir: values["data-dir"],
    conceptsDir: values["concepts-dir"],
  });

  if (candidates.length === 0) {
    console.log("[concepts-prep] every facet resolves against the registry — nothing to do");
    return EXIT_NOOP;
  }

  const candidatesPath = path.join(home.stateDir, CANDIDATES_FILENAME);
  let previousFacets = null;
  try {
    const previous = await readJson(candidatesPath);
    previousFacets = (previous.candidates ?? []).map((c) => c.facet);
  } catch (err) {
    if (err.code !== "ENOENT") throw err;
  }

  const facets = candidates.map((c) => c.facet);
  if (previousFacets !== null && JSON.stringify(previousFacets) === JSON.stringify(facets)) {
    console.log(`[concepts-prep] ${facets.length} candidate facet(s) unchanged since last run — nothing new`);
    return EXIT_NOOP;
  }

  await writeJson(candidatesPath, { generatedAt: new Date().toISOString(), stats, candidates });
  console.log(
    `[concepts-prep] ${candidates.length} unresolved facet(s) ` +
      `(${stats.facetsResolved}/${stats.facetsSeen} resolved) -> ${candidatesPath}`,
  );
  return 0;
}

main().then(
  (code) => process.exit(code),
  (err) => {
    console.error(`[concepts-prep] ${err.message}`);
    process.exit(1);
  },
);
