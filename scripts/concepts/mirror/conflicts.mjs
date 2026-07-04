// Conflict report: reference-only entries written into the pipeline home's
// conflicts/ dir. Entries carry paths, hashes, and line numbers — NEVER note
// content. That invariant is what makes the report safe to inspect anywhere.

import { writeFile } from "node:fs/promises";
import path from "node:path";

export const CONFLICT_TYPES = new Set([
  "human-edit",
  "sync-conflict-file",
  "leftover-temp",
  "basename-collision",
  "dangling-wikilink",
  "note-parse-error",
]);

// Fields any entry may carry. `detail` is a short mirror-generated phrase
// (never quoted note text); everything else is a path/hash/line-number.
const ALLOWED_FIELDS = new Set([
  "type",
  "path",
  "paths",
  "conceptId",
  "expectedHash",
  "actualHash",
  "beginLine",
  "endLine",
  "target",
  "detail",
]);

export function createConflictReport() {
  return { entries: [] };
}

export function addConflict(report, entry) {
  if (!CONFLICT_TYPES.has(entry.type)) {
    throw new Error(`unknown conflict type: ${JSON.stringify(entry.type)}`);
  }
  for (const key of Object.keys(entry)) {
    if (!ALLOWED_FIELDS.has(key)) {
      throw new Error(`conflict entry field ${JSON.stringify(key)} is not reference-only-safe`);
    }
  }
  report.entries.push({ ...entry });
}

/** Write the run's report (even when empty — an empty report is a receipt). */
export async function writeConflictReport(conflictsDir, report, now = new Date()) {
  const stamp = now.toISOString().replace(/[:.]/g, "-");
  const filePath = path.join(conflictsDir, `mirror-${stamp}.json`);
  await writeFile(
    filePath,
    `${JSON.stringify({ generatedAt: now.toISOString(), entries: report.entries }, null, 2)}\n`,
    "utf8",
  );
  return filePath;
}
