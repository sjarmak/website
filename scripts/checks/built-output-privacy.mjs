#!/usr/bin/env node
// Built-output privacy assertion for the vault-to-site pull pipeline.
// Runnable standalone post-build:
//
//   npm run build && node scripts/checks/built-output-privacy.mjs
//
// Given dist/ plus the pipeline-home pull artifacts (candidates list, edge
// drafts, applied manifest), asserts that NO candidate-derived string — note
// titles, accepted takeaway drafts, rejected takeaway drafts — appears
// anywhere under dist/ (every file, which includes llms.txt / llms-full.txt
// when those routes are present) unless its edge id is in the applied
// manifest. Rejected drafts have no applied edge id by construction, so they
// must never appear.
//
// A missing candidates file is a clean pass: nothing was ever pulled, so
// there is nothing to leak (the dark-ship state).
//
// Usage:
//   node scripts/checks/built-output-privacy.mjs [--dist DIR]
//     [--candidates FILE] [--edges FILE] [--rejected FILE] [--manifest FILE]

import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { parseArgs } from "node:util";
import { fileURLToPath } from "node:url";
import { resolvePipelineHome } from "../concepts/lib/pipeline-home.mjs";
import {
  PULL_APPLIED_MANIFEST_FILENAME,
  PULL_CANDIDATES_FILENAME,
  PULL_EDGES_FILENAME,
  PULL_REJECTED_FILENAME,
} from "../concepts/pull/config.mjs";

const MODULE_DIR = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(MODULE_DIR, "..", "..");

async function readJsonIfPresent(filePath) {
  try {
    return JSON.parse(await readFile(filePath, "utf8"));
  } catch (err) {
    if (err.code === "ENOENT") return null;
    throw new Error(`${filePath}: ${err.message}`);
  }
}

async function listFiles(dir) {
  const out = [];
  const entries = await readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const abs = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...(await listFiles(abs)));
    else if (entry.isFile()) out.push(abs);
  }
  return out;
}

// Assemble the strings that must not appear, each with the edge ids that
// could legitimize it. A string is allowed only when at least one of its
// edge ids is in the applied manifest.
function collectGuardedStrings({ candidates, edges, rejected }) {
  const guarded = []; // { text, label, edgeIds }
  const edgeIdsByVaultId = new Map();
  for (const edge of edges) {
    const list = edgeIdsByVaultId.get(edge.vaultId) ?? [];
    list.push(edge.edgeId);
    edgeIdsByVaultId.set(edge.vaultId, list);
  }
  for (const c of candidates) {
    guarded.push({
      text: c.title,
      label: `note title for vault:${c.id}`,
      edgeIds: edgeIdsByVaultId.get(c.id) ?? [],
    });
  }
  for (const edge of edges) {
    guarded.push({ text: edge.takeaway, label: `takeaway draft ${edge.edgeId}`, edgeIds: [edge.edgeId] });
  }
  for (const r of rejected) {
    // Rejected drafts are never applied — no edge id can legitimize them.
    guarded.push({ text: r.takeaway, label: `REJECTED takeaway draft ${r.edgeId}`, edgeIds: [] });
  }
  return guarded.filter((g) => typeof g.text === "string" && g.text.trim() !== "");
}

async function main() {
  const { values } = parseArgs({
    options: {
      dist: { type: "string", default: path.join(REPO_ROOT, "dist") },
      candidates: { type: "string" },
      edges: { type: "string" },
      rejected: { type: "string" },
      manifest: { type: "string" },
    },
  });

  const home = resolvePipelineHome();
  const candidatesPath = values.candidates ?? path.join(home, "state", PULL_CANDIDATES_FILENAME);
  const edgesPath = values.edges ?? path.join(home, "review", PULL_EDGES_FILENAME);
  const rejectedPath = values.rejected ?? path.join(home, "review", PULL_REJECTED_FILENAME);
  const manifestPath = values.manifest ?? path.join(home, "state", PULL_APPLIED_MANIFEST_FILENAME);

  const candidatesFile = await readJsonIfPresent(candidatesPath);
  if (candidatesFile === null) {
    console.log(`[privacy] no candidates file at ${candidatesPath} — nothing pulled, dist is clean by construction`);
    return 0;
  }
  const edgesFile = await readJsonIfPresent(edgesPath);
  const rejectedFile = await readJsonIfPresent(rejectedPath);
  const manifest = await readJsonIfPresent(manifestPath);
  const appliedEdgeIds = new Set(manifest?.appliedEdgeIds ?? []);

  const guarded = collectGuardedStrings({
    candidates: candidatesFile.candidates ?? [],
    edges: edgesFile?.edges ?? [],
    rejected: rejectedFile?.rejected ?? [],
  });
  const disallowed = guarded.filter((g) => !g.edgeIds.some((id) => appliedEdgeIds.has(id)));

  const distDir = path.resolve(values.dist);
  const files = await listFiles(distDir); // throws if dist/ is missing — run the build first
  const violations = [];
  for (const file of files) {
    const content = await readFile(file);
    for (const g of disallowed) {
      if (content.includes(Buffer.from(g.text, "utf8"))) {
        violations.push({ file: path.relative(distDir, file), label: g.label });
      }
    }
  }

  if (violations.length > 0) {
    for (const v of violations) {
      console.error(`[privacy] VIOLATION: ${v.label} appears in dist/${v.file}`);
    }
    console.error(
      `[privacy] ${violations.length} violation(s): candidate-derived strings reached the built output ` +
        "without an applied-manifest edge id",
    );
    return 1;
  }

  console.log(
    `[privacy] OK: ${files.length} built file(s) scanned, ${disallowed.length} unapplied candidate-derived ` +
      `string(s) absent (applied manifest: ${appliedEdgeIds.size} edge id(s))`,
  );
  return 0;
}

main().then(
  (code) => process.exit(code),
  (err) => {
    console.error(`[privacy] ${err.message}`);
    process.exit(1);
  },
);
