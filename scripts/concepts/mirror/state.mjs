// Mirror state model.
//
// The note's OWN frontmatter (concept-id + content-hash) is authoritative.
// The state file — state/mirror-<hostname>.json in the pipeline home — is a
// rebuildable cache bound to a machine identity. When it is missing or
// disagrees with the notes' frontmatter while the owned folder is non-empty,
// the run is TERMINAL: exit non-zero, zero writes, mandatory dry-run, until
// a human passes the explicit rebuild-confirm flag, which re-derives the
// baseline from note frontmatter. This is never routed into collision
// suffixing — a broken baseline halts, it does not fork filenames.

import { readFile, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

export const STATE_VERSION = 1;

/** Terminal baseline failure: the caller must halt before any write. */
export class BaselineError extends Error {}

export function stateFilePath(stateDir, machine = os.hostname()) {
  return path.join(stateDir, `mirror-${machine}.json`);
}

export function createEmptyState(machine = os.hostname(), now = new Date()) {
  return { version: STATE_VERSION, machine, updatedAt: now.toISOString(), notes: {} };
}

/** Read the state file; returns null when it does not exist. */
export async function readState(filePath) {
  let raw;
  try {
    raw = await readFile(filePath, "utf8");
  } catch (err) {
    if (err.code === "ENOENT") return null;
    throw err;
  }
  const state = JSON.parse(raw);
  if (state.version !== STATE_VERSION || typeof state.notes !== "object" || state.notes === null) {
    throw new BaselineError(`state file ${filePath} has an unrecognized shape — rebuild required`);
  }
  return state;
}

export async function writeState(filePath, state, now = new Date()) {
  await writeFile(filePath, `${JSON.stringify({ ...state, updatedAt: now.toISOString() }, null, 2)}\n`, "utf8");
}

/**
 * Validate the baseline before any write decision.
 *
 * @param state       parsed state file or null (missing)
 * @param ownedNotes  [{ file, conceptId, frontmatterHash }] read from the
 *                    owned folder (the authoritative side)
 * @throws BaselineError when the owned folder is non-empty and the state is
 *         missing or any note disagrees with its state entry.
 */
export function checkBaseline(state, ownedNotes) {
  if (ownedNotes.length === 0) return; // fresh vault folder: bootstrap is safe
  if (state === null) {
    throw new BaselineError(
      "owned folder contains mirrored notes but the local state file is missing. " +
        "Refusing to write. Re-run with --rebuild-state to rebuild the baseline " +
        "from note frontmatter (the authoritative record).",
    );
  }
  for (const note of ownedNotes) {
    const entry = state.notes[note.conceptId];
    if (!entry || entry.contentHash !== note.frontmatterHash || entry.file !== note.file) {
      throw new BaselineError(
        `state entry for concept "${note.conceptId}" is ${entry ? "stale" : "missing"} ` +
          `(note ${note.file}). Refusing to write. Re-run with --rebuild-state to ` +
          "rebuild the baseline from note frontmatter.",
      );
    }
  }
}

/** Rebuild the baseline from note frontmatter (explicit human action only). */
export function rebuildBaseline(ownedNotes, machine = os.hostname(), now = new Date()) {
  const state = createEmptyState(machine, now);
  for (const note of ownedNotes) {
    state.notes[note.conceptId] = { file: note.file, contentHash: note.frontmatterHash };
  }
  return state;
}
