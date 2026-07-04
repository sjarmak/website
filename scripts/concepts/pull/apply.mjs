#!/usr/bin/env node
// Stage 3 of the vault-to-site pull: the HUMAN-INVOKED apply step — the ONLY
// stage that writes to a committed path. MANUAL-INVOCATION-ONLY.
//
// For every accepted edge in review/pull-edges.json:
//   1. Re-checks the opt-in marker on the source note (the marker is checked
//      at prep AND at apply — removing it between the two refuses the edge)
//      and re-checks the hard exclusions.
//   2. Re-runs the takeaway guards (injection boundary, defense in depth).
//   3. Renders the takeaway IN FULL — the literal bytes destined for
//      src/data/knowledge/concept-assignments.json, which the public site and
//      the LLM-scraper endpoints (llms-full.txt) serve verbatim.
//   4. Requires per-edge confirmation: --yes-edge <edgeId> flags, or
//      interactive y/n on a TTY. Unconfirmed edges are refused.
//
// Confirmed edges become `vault:<id>` entries (opaque stable id — never the
// note's path or title). The merged file is validated through the existing
// scripts/knowledge/validate_concept_assignments.mjs BEFORE the real file is
// written; applied edge ids are recorded in state/pull-applied-manifest.json
// for scripts/checks/built-output-privacy.mjs.
//
// Usage:
//   node scripts/concepts/pull/apply.mjs --vault-root <dir> [--yes-edge <edgeId>]...
//                                        [--assignments <file>]

import { spawnSync } from "node:child_process";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import readline from "node:readline/promises";
import { parseArgs } from "node:util";
import { fileURLToPath } from "node:url";
import { ensurePipelineHome } from "../lib/pipeline-home.mjs";
import { loadExclusions } from "../lib/exclusions.mjs";
import { findTakeawayViolation } from "./guards.mjs";
import { isExcluded, optInStatus, parseNote } from "./vault-scan.mjs";
import {
  PULL_APPLIED_MANIFEST_FILENAME,
  PULL_CANDIDATES_FILENAME,
  PULL_EDGES_FILENAME,
  resolveVaultRoot,
} from "./config.mjs";

const MODULE_DIR = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(MODULE_DIR, "..", "..", "..");
const DEFAULT_ASSIGNMENTS = path.join(REPO_ROOT, "src", "data", "knowledge", "concept-assignments.json");
const VALIDATOR = path.join(REPO_ROOT, "scripts", "knowledge", "validate_concept_assignments.mjs");

async function readJson(filePath, hint) {
  try {
    return JSON.parse(await readFile(filePath, "utf8"));
  } catch (err) {
    if (err.code === "ENOENT") throw new Error(`${filePath} not found — ${hint}`);
    throw new Error(`${filePath}: ${err.message}`);
  }
}

// Re-check that the source note is still opted in and not excluded.
// Returns { ok: true, body } or { ok: false, reason }.
async function recheckSource(vaultRoot, relPath, patterns) {
  if (isExcluded(relPath, patterns)) {
    return { ok: false, reason: "source path matches the exclusion list" };
  }
  let raw;
  try {
    raw = await readFile(path.join(vaultRoot, relPath), "utf8");
  } catch {
    return { ok: false, reason: "source note no longer readable" };
  }
  const { frontmatter, body } = parseNote(raw);
  const status = optInStatus(relPath, frontmatter);
  if (!status.optedIn) {
    return { ok: false, reason: "opt-in marker no longer present on the source note" };
  }
  return { ok: true, body: body.trim() };
}

// Render the FULL takeaway (no truncation): these are the literal bytes that
// land in the committed file and on the public/LLM-facing surfaces.
function renderEdge(edge) {
  const destined = JSON.stringify(
    { [`vault:${edge.vaultId}`]: { concept: edge.concept, takeaway: edge.takeaway } },
    null,
    2,
  );
  console.log("");
  console.log(`edge ${edge.edgeId}`);
  console.log(`  concept:  ${edge.concept}`);
  console.log(`  takeaway (FULL, ${Buffer.byteLength(edge.takeaway, "utf8")} bytes):`);
  console.log(`    ${edge.takeaway.split("\n").join("\n    ")}`);
  console.log("  exact JSON destined for src/data/knowledge/concept-assignments.json:");
  console.log(destined.split("\n").map((l) => `    ${l}`).join("\n"));
  console.log(
    "  WARNING: this string will appear on the public site and in LLM-scraper endpoints (llms-full.txt).",
  );
}

async function confirmEdge(edge, yesEdges, rl) {
  if (yesEdges.has(edge.edgeId)) return true;
  if (rl === null) return false; // non-interactive and not pre-confirmed
  const answer = (await rl.question(`apply ${edge.edgeId}? [y/N] `)).trim().toLowerCase();
  return answer === "y" || answer === "yes";
}

function runValidator(assignmentsPath) {
  const result = spawnSync(process.execPath, [VALIDATOR, assignmentsPath], {
    cwd: REPO_ROOT,
    encoding: "utf8",
  });
  if (result.status !== 0) {
    throw new Error(
      `validator failed — real assignments file NOT written\n${result.stderr ?? ""}${result.stdout ?? ""}`,
    );
  }
}

async function main() {
  const { values } = parseArgs({
    options: {
      "vault-root": { type: "string" },
      assignments: { type: "string", default: DEFAULT_ASSIGNMENTS },
      "yes-edge": { type: "string", multiple: true, default: [] },
    },
  });
  const vaultRoot = resolveVaultRoot(values["vault-root"]);
  const yesEdges = new Set(values["yes-edge"]);

  const home = await ensurePipelineHome();
  const patterns = await loadExclusions();
  const edgesFile = await readJson(
    path.join(home.reviewDir, PULL_EDGES_FILENAME),
    "run scripts/concepts/pull/assign.mjs first",
  );
  const candidatesFile = await readJson(
    path.join(home.stateDir, PULL_CANDIDATES_FILENAME),
    "run scripts/concepts/pull/prep.mjs first",
  );
  const relPathById = new Map(candidatesFile.candidates.map((c) => [c.id, c.relPath]));

  const edges = edgesFile.edges ?? [];
  if (edges.length === 0) {
    console.log("[pull-apply] no accepted edges to apply");
    return 0;
  }

  const rl =
    process.stdin.isTTY && process.stdout.isTTY
      ? readline.createInterface({ input: process.stdin, output: process.stdout })
      : null;

  const confirmed = [];
  const refused = [];
  const claimedVaultIds = new Set();
  try {
    for (const edge of edges) {
      const relPath = relPathById.get(edge.vaultId);
      if (relPath === undefined) {
        refused.push({ edge, reason: "no candidate record for this vault id — re-run prep" });
        continue;
      }
      const recheck = await recheckSource(vaultRoot, relPath, patterns);
      if (!recheck.ok) {
        refused.push({ edge, reason: recheck.reason });
        continue;
      }
      const violation = findTakeawayViolation(edge.takeaway, recheck.body);
      if (violation !== null) {
        refused.push({ edge, reason: `guard violation at apply: ${violation}` });
        continue;
      }
      if (claimedVaultIds.has(edge.vaultId)) {
        refused.push({ edge, reason: "another confirmed edge already claims this vault note (one concept per note)" });
        continue;
      }
      renderEdge(edge);
      if (await confirmEdge(edge, yesEdges, rl)) {
        confirmed.push(edge);
        claimedVaultIds.add(edge.vaultId);
      } else {
        refused.push({ edge, reason: "not confirmed (no --yes-edge flag and no interactive approval)" });
      }
    }
  } finally {
    rl?.close();
  }

  for (const { edge, reason } of refused) {
    console.error(`[pull-apply] REFUSED ${edge.edgeId}: ${reason}`);
  }

  if (confirmed.length > 0) {
    const assignmentsPath = path.resolve(values.assignments);
    const assignments = await readJson(assignmentsPath, "assignments file must exist");
    for (const edge of confirmed) {
      const key = `vault:${edge.vaultId}`;
      if (key in assignments) {
        throw new Error(`${key} already exists in ${assignmentsPath} — remove it first if replacing`);
      }
      assignments[key] = { concept: edge.concept, takeaway: edge.takeaway };
    }

    // Validate the merged content on a staging copy BEFORE touching the real
    // file; a validator failure leaves the committed path untouched.
    const stagingPath = path.join(home.stateDir, "pull-apply-staging.json");
    const serialized = JSON.stringify(assignments, null, 2) + "\n";
    await writeFile(stagingPath, serialized, "utf8");
    runValidator(stagingPath);
    await writeFile(assignmentsPath, serialized, "utf8");

    const manifestPath = path.join(home.stateDir, PULL_APPLIED_MANIFEST_FILENAME);
    let manifest = { appliedEdgeIds: [] };
    try {
      manifest = JSON.parse(await readFile(manifestPath, "utf8"));
    } catch (err) {
      if (err.code !== "ENOENT") throw err;
    }
    const appliedEdgeIds = [...new Set([...manifest.appliedEdgeIds, ...confirmed.map((e) => e.edgeId)])];
    await writeFile(manifestPath, JSON.stringify({ appliedEdgeIds }, null, 2) + "\n", "utf8");

    console.log(`[pull-apply] applied ${confirmed.length} edge(s) -> ${assignmentsPath}`);
    console.log(`[pull-apply] manifest -> ${manifestPath}`);
  }

  if (refused.length > 0) {
    console.error(`[pull-apply] ${refused.length} edge(s) refused — nothing was written for them`);
    return 1;
  }
  return 0;
}

main().then(
  (code) => process.exit(code),
  (err) => {
    console.error(`[pull-apply] ${err.message}`);
    process.exit(1);
  },
);
