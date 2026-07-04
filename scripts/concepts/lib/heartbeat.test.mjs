import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import {
  HEARTBEAT_PATH,
  createEmptyHeartbeat,
  facetResolutionRate,
  readHeartbeat,
  updateHeartbeat,
  validateHeartbeat,
} from "./heartbeat.mjs";

async function tmpHeartbeatPath(t) {
  const dir = await mkdtemp(path.join(os.tmpdir(), "concepts-heartbeat-"));
  t.after(() => rm(dir, { recursive: true, force: true }));
  return path.join(dir, "concept-sync-status.json");
}

test("update on a missing file starts from the empty heartbeat and logs it", async (t) => {
  const filePath = await tmpHeartbeatPath(t);
  const now = new Date("2026-07-04T12:00:00.000Z");
  const logged = [];

  const hb = await updateHeartbeat(
    filePath,
    {
      steps: { "digest-publish-gate": "2026-07-04T11:59:00.000Z" },
      flags: { syncEnabled: true },
      backlog: { count: 3, oldestAgeSeconds: 7200 },
      facetResolution: { resolved: 8, total: 10, rate: facetResolutionRate(8, 10) },
    },
    { now, log: (line) => logged.push(line) },
  );

  assert.equal(logged.length, 1);
  assert.match(logged[0], /missing; starting from empty heartbeat/);
  assert.equal(hb.updatedAt, "2026-07-04T12:00:00.000Z");
  assert.deepEqual(hb.steps["digest-publish-gate"], { lastRunAt: "2026-07-04T11:59:00.000Z" });
  assert.equal(hb.flags.syncEnabled, true);
  assert.deepEqual(hb.backlog, { count: 3, oldestAgeSeconds: 7200 });
  assert.deepEqual(hb.facetResolution, { resolved: 8, total: 10, rate: 0.8 });

  // The file on disk is schema-valid and matches what was returned.
  assert.deepEqual(await readHeartbeat(filePath), hb);
});

test("update merges per-step last-run and flags without dropping existing ones", async (t) => {
  const filePath = await tmpHeartbeatPath(t);
  await updateHeartbeat(
    filePath,
    { steps: { "step-a": "2026-07-01T00:00:00.000Z" }, flags: { alarmArmed: false } },
    { now: new Date("2026-07-01T00:00:00.000Z"), log: () => {} },
  );

  const hb = await updateHeartbeat(
    filePath,
    { steps: { "step-b": "2026-07-02T00:00:00.000Z" }, flags: { alarmArmed: true } },
    { now: new Date("2026-07-02T00:00:00.000Z"), log: () => {} },
  );

  assert.deepEqual(hb.steps, {
    "step-a": { lastRunAt: "2026-07-01T00:00:00.000Z" },
    "step-b": { lastRunAt: "2026-07-02T00:00:00.000Z" },
  });
  assert.deepEqual(hb.flags, { alarmArmed: true });
});

test("validateHeartbeat rejects bad shapes, naming the field", () => {
  const good = createEmptyHeartbeat(new Date("2026-07-04T00:00:00.000Z"));
  validateHeartbeat(good);

  assert.throws(() => validateHeartbeat({ ...good, version: 2 }), /version/);
  assert.throws(() => validateHeartbeat({ ...good, updatedAt: "not-a-date" }), /updatedAt/);
  assert.throws(() => validateHeartbeat({ ...good, steps: { x: { lastRunAt: 5 } } }), /steps\.x\.lastRunAt/);
  assert.throws(() => validateHeartbeat({ ...good, flags: { f: "yes" } }), /flags\.f/);
  assert.throws(() => validateHeartbeat({ ...good, backlog: { count: -1, oldestAgeSeconds: null } }), /backlog\.count/);
  assert.throws(
    () => validateHeartbeat({ ...good, backlog: { count: 0, oldestAgeSeconds: 10 } }),
    /backlog\.oldestAgeSeconds/,
  );
  assert.throws(
    () => validateHeartbeat({ ...good, facetResolution: { resolved: 3, total: 2, rate: 1 } }),
    /exceeds total/,
  );
  assert.throws(
    () => validateHeartbeat({ ...good, facetResolution: { resolved: 1, total: 2, rate: 7 } }),
    /facetResolution\.rate/,
  );
});

test("facetResolutionRate: null for 0/0, fraction otherwise, rejects bad counts", () => {
  assert.equal(facetResolutionRate(0, 0), null);
  assert.equal(facetResolutionRate(3, 4), 0.75);
  assert.throws(() => facetResolutionRate(-1, 4), /non-negative/);
  assert.throws(() => facetResolutionRate(5, 4), /exceeds total/);
});

test("committed initial heartbeat file exists and is schema-valid", async () => {
  const hb = await readHeartbeat(HEARTBEAT_PATH);
  assert.deepEqual(hb.steps, {});
  assert.deepEqual(hb.backlog, { count: 0, oldestAgeSeconds: null });
  assert.deepEqual(hb.facetResolution, { resolved: 0, total: 0, rate: null });
  // Committed file uses the exact serialization updateHeartbeat writes.
  const text = await readFile(HEARTBEAT_PATH, "utf8");
  assert.equal(text, JSON.stringify(hb, null, 2) + "\n");
});
