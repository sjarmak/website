// Heartbeat writer for the concepts pipeline.
//
// Maintains the committed status file src/data/knowledge/concept-sync-status.json:
//   - steps:           last-run timestamp per pipeline step
//   - flags:           named boolean flag states
//   - backlog:         proposal inbox count + oldest-age (seconds)
//   - facetResolution: resolved/total/rate for facet resolution
//
// The heartbeat carries counts and timestamps ONLY — never proposal payloads —
// so committing it is always safe.

import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const MODULE_DIR = path.dirname(fileURLToPath(import.meta.url));

export const HEARTBEAT_PATH = path.resolve(
  MODULE_DIR,
  "..",
  "..",
  "..",
  "src",
  "data",
  "knowledge",
  "concept-sync-status.json",
);

export const HEARTBEAT_VERSION = 1;

export function createEmptyHeartbeat(now = new Date()) {
  return {
    version: HEARTBEAT_VERSION,
    updatedAt: now.toISOString(),
    steps: {},
    flags: {},
    backlog: { count: 0, oldestAgeSeconds: null },
    facetResolution: { resolved: 0, total: 0, rate: null },
  };
}

// rate is null when nothing has been attempted yet — 0/0 is "no data", not 0%.
export function facetResolutionRate(resolved, total) {
  if (!Number.isInteger(resolved) || resolved < 0 || !Number.isInteger(total) || total < 0) {
    throw new Error(`facet resolution counts must be non-negative integers, got resolved=${resolved} total=${total}`);
  }
  if (resolved > total) {
    throw new Error(`facet resolution resolved (${resolved}) exceeds total (${total})`);
  }
  return total === 0 ? null : resolved / total;
}

function fail(field, detail) {
  throw new Error(`invalid heartbeat: ${field} ${detail}`);
}

function requireIso(value, field) {
  if (typeof value !== "string" || Number.isNaN(Date.parse(value))) {
    fail(field, `must be an ISO timestamp, got ${JSON.stringify(value)}`);
  }
}

// Structural schema validation. Throws naming the offending field.
export function validateHeartbeat(hb) {
  if (typeof hb !== "object" || hb === null) fail("root", "must be an object");
  if (hb.version !== HEARTBEAT_VERSION) fail("version", `must be ${HEARTBEAT_VERSION}`);
  requireIso(hb.updatedAt, "updatedAt");

  if (typeof hb.steps !== "object" || hb.steps === null) fail("steps", "must be an object");
  for (const [name, step] of Object.entries(hb.steps)) {
    if (typeof step !== "object" || step === null) fail(`steps.${name}`, "must be an object");
    requireIso(step.lastRunAt, `steps.${name}.lastRunAt`);
  }

  if (typeof hb.flags !== "object" || hb.flags === null) fail("flags", "must be an object");
  for (const [name, value] of Object.entries(hb.flags)) {
    if (typeof value !== "boolean") fail(`flags.${name}`, "must be a boolean");
  }

  const b = hb.backlog;
  if (typeof b !== "object" || b === null) fail("backlog", "must be an object");
  if (!Number.isInteger(b.count) || b.count < 0) fail("backlog.count", "must be a non-negative integer");
  if (b.oldestAgeSeconds !== null && (!Number.isInteger(b.oldestAgeSeconds) || b.oldestAgeSeconds < 0)) {
    fail("backlog.oldestAgeSeconds", "must be null or a non-negative integer");
  }
  if (b.count === 0 && b.oldestAgeSeconds !== null) {
    fail("backlog.oldestAgeSeconds", "must be null when count is 0");
  }

  const f = hb.facetResolution;
  if (typeof f !== "object" || f === null) fail("facetResolution", "must be an object");
  facetResolutionRate(f.resolved, f.total);
  if (f.total === 0) {
    if (f.rate !== null) fail("facetResolution.rate", "must be null when total is 0");
  } else if (typeof f.rate !== "number" || f.rate < 0 || f.rate > 1) {
    fail("facetResolution.rate", "must be a number in [0, 1]");
  }

  return hb;
}

export async function readHeartbeat(filePath = HEARTBEAT_PATH) {
  const text = await readFile(filePath, "utf8");
  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch (err) {
    throw new Error(`${filePath}: malformed heartbeat JSON (${err.message})`);
  }
  return validateHeartbeat(parsed);
}

// Merge `updates` into the heartbeat on disk and write it back. Immutable:
// builds and returns a new object. Missing file starts from the empty
// heartbeat, with a log line (no silent resource creation).
//
// updates: {
//   steps?:           { [stepName]: isoTimestamp },   // last-run per step
//   flags?:           { [flagName]: boolean },
//   backlog?:         { count, oldestAgeSeconds },
//   facetResolution?: { resolved, total, rate },
// }
export async function updateHeartbeat(filePath, updates = {}, { now = new Date(), log = console.error } = {}) {
  let existing;
  try {
    existing = await readHeartbeat(filePath);
  } catch (err) {
    if (err.code !== "ENOENT") throw err;
    existing = createEmptyHeartbeat(now);
    log(`[concepts] heartbeat file ${filePath} missing; starting from empty heartbeat`);
  }

  const stepUpdates = {};
  for (const [name, lastRunAt] of Object.entries(updates.steps ?? {})) {
    stepUpdates[name] = { lastRunAt };
  }

  const next = validateHeartbeat({
    version: HEARTBEAT_VERSION,
    updatedAt: now.toISOString(),
    steps: { ...existing.steps, ...stepUpdates },
    flags: { ...existing.flags, ...(updates.flags ?? {}) },
    backlog: updates.backlog ?? existing.backlog,
    facetResolution: updates.facetResolution ?? existing.facetResolution,
  });

  await writeFile(filePath, JSON.stringify(next, null, 2) + "\n", "utf8");
  return next;
}
