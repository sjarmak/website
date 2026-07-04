#!/usr/bin/env node
// Concepts mirror runner — renders the top-N concepts (by evidence count)
// into a single owned subfolder of an Obsidian vault.
//
// SAFETY MODEL
//   - The vault root is always injected (CONCEPTS_VAULT_ROOT / --vault-root);
//     there is no default. Missing root = hard usage error.
//   - DRY-RUN IS THE DEFAULT. Real writes require BOTH --write and
//     CONCEPTS_MIRROR_CONFIRM=1.
//   - Additive-only: journaled temp+fsync+rename writes inside the owned
//     folder; nothing is ever deleted or renamed away.
//   - The note frontmatter is authoritative; the machine-bound state file is
//     a rebuildable cache. Missing/mismatched state with a non-empty owned
//     folder is TERMINAL (exit 1, zero writes) until --rebuild-state.
//
// Usage:
//   node scripts/concepts/mirror/run-mirror.mjs --vault-root <path> [--write]
//        [--folder <name>] [--top-n 10] [--rebuild-state]
//        [--machine <id>] [--now <iso>]

import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { ensurePipelineHome } from "../lib/pipeline-home.mjs";
import { REPO_ROOT } from "../lib/pipeline-home.mjs";
import {
  VaultConfigError,
  VaultUnreachableError,
  assertVaultReachable,
  resolveOwnedFolderName,
  resolveVaultRoot,
} from "./vault-root.mjs";
import { buildEvidence, topConcepts } from "./evidence.mjs";
import { contentHash, extractWikilinkTargets, canonicalWikilinkTarget, serializeNote } from "./normalize.mjs";
import { MANAGED_FRONTMATTER_KEYS, noteFilename, renderFrontmatter, renderManagedRegion, renderNote } from "./render.mjs";
import { buildBasenameIndex, scanOwnedFolder } from "./scan.mjs";
import { BaselineError, checkBaseline, readState, rebuildBaseline, stateFilePath, writeState } from "./state.mjs";
import { addConflict, createConflictReport, writeConflictReport } from "./conflicts.mjs";
import { ensureOwnedFolder, journaledWrite } from "./writer.mjs";

export const DEFAULT_TOP_N = 10;

function defaultDataPaths(env) {
  return {
    conceptsDir: env.CONCEPTS_CONCEPTS_DIR ?? path.join(REPO_ROOT, "src", "content", "concepts"),
    assignmentsPath:
      env.CONCEPTS_ASSIGNMENTS_PATH ?? path.join(REPO_ROOT, "src", "data", "knowledge", "concept-assignments.json"),
    digestDir: env.CONCEPTS_DIGEST_DIR ?? path.join(REPO_ROOT, "src", "content", "digest"),
    explorersPath: env.CONCEPTS_EXPLORERS_PATH ?? path.join(REPO_ROOT, "src", "data", "knowledge", "explorers.json"),
    threadsPath: env.CONCEPTS_THREADS_PATH ?? path.join(REPO_ROOT, "src", "data", "knowledge", "threads.json"),
  };
}

/** Merge managed frontmatter into an existing note's frontmatter, preserving
 *  every key the mirror does not own (human annotation space). */
function mergeFrontmatter(existing, managed) {
  const merged = { ...existing };
  for (const key of MANAGED_FRONTMATTER_KEYS) merged[key] = managed[key];
  return merged;
}

/**
 * Run the mirror. Returns { exitCode, written, planned, skipped, conflicts,
 * reportPath }. Never throws for per-note failures (fail-the-note-not-the-run);
 * throws typed errors for config/terminal conditions when `throwOnFatal`.
 */
export async function runMirror({
  env = process.env,
  vaultRoot: vaultRootArg,
  folder: folderArg,
  topN = DEFAULT_TOP_N,
  write = false,
  rebuildState = false,
  machine = os.hostname(),
  now = new Date(),
  log = console.error,
} = {}) {
  const vaultRoot = resolveVaultRoot({ env, cliValue: vaultRootArg });
  const folderName = resolveOwnedFolderName({ env, cliValue: folderArg });

  if (write && env.CONCEPTS_MIRROR_CONFIRM !== "1") {
    throw new VaultConfigError(
      "--write requires CONCEPTS_MIRROR_CONFIRM=1. Real vault writes need both the " +
        "flag and the confirm env; without them this run stays a dry-run.",
    );
  }

  await assertVaultReachable(vaultRoot);
  const home = await ensurePipelineHome(env, { log });
  const ownedDir = path.join(vaultRoot, folderName);
  const report = createConflictReport();

  // --- Owned-folder inventory + startup quarantine of leftovers ------------
  const inventory = await scanOwnedFolder(ownedDir);
  for (const file of inventory.syncConflicts) {
    addConflict(report, { type: "sync-conflict-file", path: path.join(folderName, file) });
  }
  for (const file of inventory.leftoverTemps) {
    addConflict(report, { type: "leftover-temp", path: path.join(folderName, file) });
  }
  const mirroredNotes = [];
  for (const note of inventory.notes) {
    if (note.parseError || !note.conceptId || !note.frontmatterHash) {
      addConflict(report, {
        type: "note-parse-error",
        path: path.join(folderName, note.file),
        detail: note.parseError ?? "missing concept-id/content-hash frontmatter",
      });
      continue;
    }
    mirroredNotes.push(note);
  }

  // --- Baseline: note frontmatter is authoritative; state is a cache -------
  const statePath = stateFilePath(home.stateDir, machine);
  let state;
  if (rebuildState) {
    state = rebuildBaseline(mirroredNotes, machine, now);
    await writeState(statePath, state, now);
    log(`[concepts-mirror] baseline rebuilt from note frontmatter (${mirroredNotes.length} notes) -> ${statePath}`);
  } else {
    state = await readState(statePath);
    checkBaseline(state, mirroredNotes); // throws BaselineError => terminal
    state = state ?? rebuildBaseline([], machine, now);
  }

  // --- Evidence join + vault-wide scans ------------------------------------
  const bundles = topConcepts(await buildEvidence(defaultDataPaths(env)), topN);
  const basenameIndex = await buildBasenameIndex(vaultRoot);
  const mirroredBasenames = new Set(bundles.map((b) => canonicalWikilinkTarget(noteFilename(b).replace(/\.md$/, ""))));
  const byConceptId = new Map(mirroredNotes.map((n) => [n.conceptId, n]));
  const leftoverSet = new Set(inventory.leftoverTemps);

  const result = { written: 0, planned: 0, skipped: 0, bytesWritten: 0 };

  for (const bundle of bundles) {
    const existing = byConceptId.get(bundle.slug);
    const filename = existing ? existing.file : noteFilename(bundle);
    const relPath = path.join(folderName, filename);
    const baseKey = canonicalWikilinkTarget(filename.replace(/\.md$/, ""));

    // Vault-wide basename ambiguity: a non-mirror note sharing the basename.
    const collisions = (basenameIndex.get(baseKey) ?? []).filter((p) => !p.startsWith(`${folderName}/`));
    if (collisions.length > 0) {
      addConflict(report, { type: "basename-collision", path: relPath, paths: collisions, conceptId: bundle.slug });
      // Surfaced, never renamed — the mirror still owns its own copy.
    }

    const managed = renderManagedRegion(bundle);

    // Wikilink resolution: fail the note, not the run.
    const dangling = extractWikilinkTargets(managed).filter((target) => {
      const key = canonicalWikilinkTarget(target);
      return !basenameIndex.has(key) && !mirroredBasenames.has(key);
    });
    if (dangling.length > 0) {
      for (const target of dangling) {
        addConflict(report, { type: "dangling-wikilink", path: relPath, conceptId: bundle.slug, target });
      }
      result.skipped += 1;
      continue;
    }

    const newHash = contentHash(managed);
    let content;
    if (existing) {
      const diskHash = contentHash(existing.parsed.managed);
      if (diskHash !== existing.frontmatterHash) {
        // Human edit inside the managed region: reference-only conflict.
        addConflict(report, {
          type: "human-edit",
          path: relPath,
          conceptId: bundle.slug,
          expectedHash: existing.frontmatterHash,
          actualHash: diskHash,
          beginLine: existing.parsed.beginLine,
          endLine: existing.parsed.endLine,
        });
        result.skipped += 1;
        continue;
      }
      if (newHash === existing.frontmatterHash) {
        result.skipped += 1; // pre-write hash gate: unchanged = zero bytes
        continue;
      }
      content = serializeNote({
        frontmatter: mergeFrontmatter(
          existing.parsed.frontmatter,
          renderFrontmatter(bundle, { updated: now.toISOString(), managedRegion: managed }),
        ),
        pre: existing.parsed.pre,
        managed,
        post: existing.parsed.post,
      });
    } else {
      content = renderNote(bundle, { updated: now.toISOString() });
    }

    if ([...leftoverSet].some((t) => t.startsWith(filename))) {
      // A leftover journal for this note is already quarantined in the
      // report; do not write over the evidence this run.
      result.skipped += 1;
      continue;
    }

    if (!write) {
      result.planned += 1;
      log(`[concepts-mirror] dry-run: would write ${relPath} (${Buffer.byteLength(content, "utf8")} bytes)`);
      continue;
    }
    await ensureOwnedFolder(ownedDir, { log });
    const bytes = await journaledWrite(ownedDir, filename, content);
    state.notes[bundle.slug] = { file: filename, contentHash: newHash };
    result.written += 1;
    result.bytesWritten += bytes;
    log(`[concepts-mirror] wrote ${relPath} (${bytes} bytes)`);
  }

  if (write || rebuildState) await writeState(statePath, state, now);
  const reportPath = await writeConflictReport(home.conflictsDir, report, now);

  log(
    `[concepts-mirror] ${write ? "write" : "dry-run"} complete: ` +
      `${result.written} written, ${result.planned} planned, ${result.skipped} skipped, ` +
      `${report.entries.length} conflict entr${report.entries.length === 1 ? "y" : "ies"} -> ${reportPath}`,
  );
  return { exitCode: 0, ...result, conflicts: report.entries, reportPath, statePath };
}

function parseArgs(argv) {
  const opts = {};
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    const takeValue = () => {
      i += 1;
      if (i >= argv.length) throw new VaultConfigError(`${arg} requires a value`);
      return argv[i];
    };
    if (arg === "--vault-root") opts.vaultRoot = takeValue();
    else if (arg === "--folder") opts.folder = takeValue();
    else if (arg === "--top-n") opts.topN = Number.parseInt(takeValue(), 10);
    else if (arg === "--machine") opts.machine = takeValue();
    else if (arg === "--now") opts.now = new Date(takeValue());
    else if (arg === "--write") opts.write = true;
    else if (arg === "--rebuild-state") opts.rebuildState = true;
    else throw new VaultConfigError(`unknown argument: ${arg}`);
  }
  if (opts.topN !== undefined && (!Number.isInteger(opts.topN) || opts.topN < 1)) {
    throw new VaultConfigError("--top-n must be a positive integer");
  }
  if (opts.now !== undefined && Number.isNaN(opts.now.getTime())) {
    throw new VaultConfigError("--now must be an ISO timestamp");
  }
  return opts;
}

async function main() {
  let opts;
  try {
    opts = parseArgs(process.argv.slice(2));
  } catch (err) {
    console.error(`[concepts-mirror] ${err.message}`);
    process.exit(2);
  }
  try {
    const { exitCode } = await runMirror(opts);
    process.exit(exitCode);
  } catch (err) {
    if (err instanceof VaultConfigError) {
      console.error(`[concepts-mirror] usage error: ${err.message}`);
      process.exit(2);
    }
    if (err instanceof BaselineError) {
      console.error(`[concepts-mirror] TERMINAL: ${err.message}`);
      process.exit(1);
    }
    if (err instanceof VaultUnreachableError) {
      console.error(`[concepts-mirror] ${err.message}`);
      process.exit(1);
    }
    console.error(`[concepts-mirror] failed: ${err.stack ?? err.message}`);
    process.exit(1);
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await main();
}
