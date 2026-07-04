import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import os from "node:os";
import path from "node:path";
import { DEFAULT_THRESHOLD_HOURS, buildAlarmCommand, shellQuote } from "./aging-alarm.mjs";

const SCRIPT = path.join(path.dirname(fileURLToPath(import.meta.url)), "aging-alarm.mjs");
const PAYLOAD_MARKER = "VAULT-PRIVATE-PAYLOAD-MARKER";
const SOURCE_MARKER = "secret-source-name";

function runAlarm(args, env = {}) {
  return spawnSync(process.execPath, [SCRIPT, ...args], {
    encoding: "utf8",
    env: { ...process.env, ...env },
  });
}

async function agedInbox(t) {
  const dir = await mkdtemp(path.join(os.tmpdir(), "concepts-alarm-"));
  t.after(() => rm(dir, { recursive: true, force: true }));
  const inboxPath = path.join(dir, "inbox.jsonl");
  const entries = [
    { source: SOURCE_MARKER, kind: "concept", payload: `${PAYLOAD_MARKER} one`, createdAt: "2026-06-30T00:00:00.000Z" },
    { source: SOURCE_MARKER, kind: "facet", payload: `${PAYLOAD_MARKER} two`, createdAt: "2026-07-01T00:00:00.000Z" },
  ];
  await writeFile(inboxPath, entries.map((e) => JSON.stringify(e)).join("\n") + "\n");
  return { dir, inboxPath };
}

test("aged backlog + --dry-run prints a bd create command naming the count, no payload text", async (t) => {
  const { inboxPath } = await agedInbox(t);
  // now = 2026-07-04 → oldest is 96h old, past the 48h default threshold.
  const result = runAlarm(["--dry-run", "--inbox", inboxPath, "--now", "2026-07-04T00:00:00.000Z"]);

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /^bd create /);
  assert.match(result.stdout, /2 proposals/);
  assert.match(result.stdout, /96h/);
  assert.match(result.stdout, new RegExp(`${DEFAULT_THRESHOLD_HOURS}h`));

  const everything = result.stdout + result.stderr;
  assert.ok(!everything.includes(PAYLOAD_MARKER), "proposal payload text must never appear in alarm output");
  assert.ok(!everything.includes(SOURCE_MARKER), "proposal source strings must never appear in alarm output");
});

test("fresh backlog stays below threshold: no bd command constructed", async (t) => {
  const { inboxPath } = await agedInbox(t);
  const result = runAlarm(["--dry-run", "--inbox", inboxPath, "--now", "2026-07-01T01:00:00.000Z", "--threshold-hours", "48"]);
  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.stdout, "");
  assert.match(result.stderr, /backlog ok/);
});

test("without --inbox the alarm resolves the pipeline home (rejects one inside the repo)", async () => {
  const repoRoot = path.resolve(path.dirname(SCRIPT), "..", "..", "..");
  const result = runAlarm(["--dry-run", "--now", "2026-07-04T00:00:00.000Z"], {
    CONCEPTS_PIPELINE_HOME: path.join(repoRoot, "not-allowed"),
  });
  assert.equal(result.status, 1);
  assert.match(result.stderr, /inside the repo/);
});

test("buildAlarmCommand output is counts-only argv", () => {
  const command = buildAlarmCommand({ count: 1, oldestAgeHours: 50, thresholdHours: 48 });
  assert.equal(command[0], "bd");
  assert.equal(command[1], "create");
  assert.match(command[2], /1 proposal waiting past 48h/);
  assert.match(command[3], /-d/);
  assert.match(command[4], /oldest has been waiting 50h/);
  const quoted = shellQuote(command);
  assert.match(quoted, /^bd create '/);
});

test("invalid --threshold-hours fails fast", async (t) => {
  const { inboxPath } = await agedInbox(t);
  const result = runAlarm(["--dry-run", "--inbox", inboxPath, "--threshold-hours", "zero"]);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /threshold-hours/);
});
