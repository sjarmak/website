// Proposal inbox for the concepts pipeline.
//
// The ONE inbox every producer writes to (digest publish gate, knowledge-sync
// rider, backfill). Entries are JSONL: {source, kind, payload, createdAt}.
// The inbox file lives in the pipeline home (see pipeline-home.mjs) — outside
// the repo, so payloads never reach a commit.

import { appendFile, readFile } from "node:fs/promises";

function requireNonEmptyString(value, field) {
  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(`proposal ${field} must be a non-empty string, got ${JSON.stringify(value)}`);
  }
}

function validateEntry(entry, context) {
  requireNonEmptyString(entry.source, `source (${context})`);
  requireNonEmptyString(entry.kind, `kind (${context})`);
  if (entry.payload === undefined) {
    throw new Error(`proposal payload is required (${context})`);
  }
}

// Append one proposal. Returns the full entry (with createdAt) that was written.
export async function appendProposal(inboxPath, { source, kind, payload }, { now = new Date() } = {}) {
  const entry = { source, kind, payload, createdAt: now.toISOString() };
  validateEntry(entry, `append to ${inboxPath}`);
  await appendFile(inboxPath, JSON.stringify(entry) + "\n", "utf8");
  return entry;
}

// Read all proposals. Strict: a malformed or incomplete line throws with its
// line number — the inbox is a producer/consumer contract, not best-effort data.
export async function readProposals(inboxPath) {
  const text = await readFile(inboxPath, "utf8");
  const entries = [];
  const lines = text.split("\n");
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line === "") continue;
    let parsed;
    try {
      parsed = JSON.parse(line);
    } catch (err) {
      throw new Error(`${inboxPath}:${i + 1}: malformed JSON line (${err.message})`);
    }
    validateEntry(parsed, `${inboxPath}:${i + 1}`);
    if (typeof parsed.createdAt !== "string" || Number.isNaN(Date.parse(parsed.createdAt))) {
      throw new Error(`${inboxPath}:${i + 1}: createdAt must be an ISO timestamp`);
    }
    entries.push(parsed);
  }
  return entries;
}

// Backlog summary for the heartbeat and the aging alarm. Counts and ages only —
// callers must never surface payload text outside the pipeline home.
export function backlogStats(entries, { now = new Date() } = {}) {
  if (entries.length === 0) {
    return { count: 0, oldestAgeSeconds: null, oldestCreatedAt: null };
  }
  let oldest = entries[0].createdAt;
  for (const entry of entries) {
    if (entry.createdAt < oldest) oldest = entry.createdAt;
  }
  const oldestAgeSeconds = Math.floor((now.getTime() - Date.parse(oldest)) / 1000);
  return { count: entries.length, oldestAgeSeconds, oldestCreatedAt: oldest };
}
