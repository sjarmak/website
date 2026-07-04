#!/usr/bin/env node
// Stage 3 of the concepts backfill: mechanical validation + explicit apply.
// On-demand and unscheduled — no cron path invokes this.
//
// Recomputes counts and cross-checks the proposed assignments in
// review/backfill-assignments.json (valid concept slugs, valid immutable ids,
// no duplicates). ANY failure aborts without touching committed files.
//
// Only the explicit --apply step writes committed files:
//   - <data-dir>/concept-assignments.json  (merged, deduped, sorted)
//   - <data-dir>/concept-sync-status.json  (heartbeat: step timestamp,
//     facet-resolution rate, inbox backlog — counts only, never payloads)
// Registry changes (src/content/concepts/) are NEVER written here: new-concept
// and alias proposals stay in the pipeline-home inbox for human application.
//
// Usage:
//   node scripts/knowledge/concepts_validate.mjs [--apply]
//     [--digest-dir D] [--data-dir D] [--concepts-dir D]

import { access, readdir } from "node:fs/promises";
import path from "node:path";
import { parseArgs } from "node:util";
import { ensurePipelineHome } from "../concepts/lib/pipeline-home.mjs";
import { backlogStats, readProposals } from "../concepts/lib/inbox.mjs";
import { facetResolutionRate, updateHeartbeat } from "../concepts/lib/heartbeat.mjs";
import { loadConcepts } from "../../src/lib/knowledge/conceptAliases.ts";
import {
  ASSIGNMENTS_FILENAME,
  DEFAULT_CONCEPTS_DIR,
  DEFAULT_DATA_DIR,
  DEFAULT_DIGEST_DIR,
  readJson,
  writeJson,
} from "./concepts_common.mjs";

const ID_RE = /^(digest|thread):(.+)$/;

async function digestSlugs(digestDir) {
  const files = await readdir(digestDir);
  return new Set(files.filter((f) => f.endsWith(".md") || f.endsWith(".mdx")).map((f) => f.replace(/\.(md|mdx)$/, "")));
}

async function threadIds(dataDir) {
  const data = await readJson(path.join(dataDir, "threads.json"));
  return new Set((data.threads ?? []).map((t) => t.id));
}

// Pure cross-checks. Returns a list of human-readable errors (empty = valid).
export function checkAssignments(file, { conceptSlugs, digests, threads }) {
  const errors = [];
  if (!Array.isArray(file.assignments)) return [`\`assignments\` must be an array`];
  if (typeof file.promptVersion !== "string" || !/^v\d+$/.test(file.promptVersion)) {
    errors.push(`\`promptVersion\` must be v<N>, got ${JSON.stringify(file.promptVersion)}`);
  }

  const seenPairs = new Set();
  const assignedFacets = new Set();
  for (const [i, row] of file.assignments.entries()) {
    const ctx = `assignments[${i}]`;
    if (typeof row.concept !== "string" || !conceptSlugs.has(row.concept)) {
      errors.push(`${ctx}: unknown concept slug ${JSON.stringify(row.concept)}`);
    }
    if (typeof row.facet !== "string" || !row.facet) {
      errors.push(`${ctx}: missing facet`);
    } else {
      assignedFacets.add(row.facet);
    }
    const match = typeof row.id === "string" ? row.id.match(ID_RE) : null;
    if (!match) {
      errors.push(`${ctx}: id ${JSON.stringify(row.id)} is not an immutable digest:/thread: id`);
    } else if (match[1] === "digest" && !digests.has(match[2])) {
      errors.push(`${ctx}: digest ${JSON.stringify(match[2])} does not exist`);
    } else if (match[1] === "thread" && !threads.has(match[2])) {
      errors.push(`${ctx}: thread ${JSON.stringify(match[2])} does not exist`);
    }
    const pair = `${row.id} ${row.concept}`;
    if (seenPairs.has(pair)) errors.push(`${ctx}: duplicate assignment ${row.id} -> ${row.concept}`);
    seenPairs.add(pair);
  }

  // Recompute counts against what the assign stage recorded.
  const counts = file.counts ?? {};
  if (counts.assignments !== file.assignments.length) {
    errors.push(`counts.assignments is ${counts.assignments}, recomputed ${file.assignments.length}`);
  }
  if (counts.assign !== assignedFacets.size) {
    errors.push(`counts.assign is ${counts.assign}, recomputed ${assignedFacets.size} distinct assigned facet(s)`);
  }

  const fr = file.facetResolution ?? {};
  try {
    facetResolutionRate(fr.resolved, fr.total);
  } catch (err) {
    errors.push(`facetResolution invalid: ${err.message}`);
  }
  return errors;
}

// Merge new rows into an existing assignments file (immutable: returns new list).
export function mergeAssignments(existing, incoming) {
  const byPair = new Map(existing.map((row) => [`${row.id} ${row.concept}`, row]));
  for (const row of incoming) {
    byPair.set(`${row.id} ${row.concept}`, { id: row.id, concept: row.concept, facet: row.facet });
  }
  return [...byPair.values()].sort((a, b) => a.id.localeCompare(b.id) || a.concept.localeCompare(b.concept));
}

async function main() {
  const { values } = parseArgs({
    options: {
      apply: { type: "boolean", default: false },
      "digest-dir": { type: "string", default: DEFAULT_DIGEST_DIR },
      "data-dir": { type: "string", default: DEFAULT_DATA_DIR },
      "concepts-dir": { type: "string", default: DEFAULT_CONCEPTS_DIR },
    },
  });
  const dataDir = values["data-dir"];

  const home = await ensurePipelineHome();
  const assignmentsPath = path.join(home.reviewDir, ASSIGNMENTS_FILENAME);
  let file;
  try {
    file = await readJson(assignmentsPath);
  } catch (err) {
    if (err.code !== "ENOENT") throw err;
    throw new Error(`no proposed assignments at ${assignmentsPath} — run concepts_assign.mjs first`);
  }

  const errors = checkAssignments(file, {
    conceptSlugs: new Set(loadConcepts(values["concepts-dir"]).map((c) => c.slug)),
    digests: await digestSlugs(values["digest-dir"]),
    threads: await threadIds(dataDir),
  });
  if (errors.length > 0) {
    for (const e of errors) console.error(`[concepts-validate] INVALID: ${e}`);
    console.error(`[concepts-validate] ${errors.length} error(s) — aborting, no committed files touched`);
    return 1;
  }
  console.log(`[concepts-validate] ${file.assignments.length} assignment row(s) valid (prompt ${file.promptVersion})`);

  if (!values.apply) {
    console.log("[concepts-validate] dry run — re-run with --apply to write concept-assignments.json");
    return 0;
  }

  // Explicit apply: the only step in the pipeline allowed to write committed files.
  const targetPath = path.join(dataDir, "concept-assignments.json");
  let existing = [];
  try {
    await access(targetPath);
    existing = (await readJson(targetPath)).assignments ?? [];
  } catch {
    console.log(`[concepts-validate] creating ${targetPath}`);
  }
  const merged = mergeAssignments(existing, file.assignments);
  await writeJson(targetPath, { version: 1, updatedAt: new Date().toISOString(), assignments: merged });

  const proposals = await readProposals(home.inboxPath);
  const backlog = backlogStats(proposals);
  await updateHeartbeat(path.join(dataDir, "concept-sync-status.json"), {
    steps: { "backfill-apply": new Date().toISOString() },
    backlog: { count: backlog.count, oldestAgeSeconds: backlog.oldestAgeSeconds },
    facetResolution: {
      resolved: file.facetResolution.resolved,
      total: file.facetResolution.total,
      rate: facetResolutionRate(file.facetResolution.resolved, file.facetResolution.total),
    },
  });
  console.log(
    `[concepts-validate] applied ${file.assignments.length} row(s) (${merged.length} total) -> ${targetPath}; ` +
      `heartbeat updated (backlog ${backlog.count})`,
  );
  console.log("[concepts-validate] registry proposals (new concepts / aliases) remain in the inbox for human review");
  return 0;
}

const invokedDirectly = process.argv[1] && path.resolve(process.argv[1]) === path.resolve(new URL(import.meta.url).pathname);
if (invokedDirectly) {
  main().then(
    (code) => process.exit(code),
    (err) => {
      console.error(`[concepts-validate] ${err.message}`);
      process.exit(1);
    },
  );
}
