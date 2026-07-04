import { test } from "node:test";
import assert from "node:assert/strict";
import { access, mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import {
  MEMBERSHIP_FILENAME,
  SNAPSHOT_FILENAME,
  loadExplorers,
  overlapRatio,
  paperId,
  recordRiderFailure,
  runRider,
} from "../scripts/knowledge/concepts_rider.mjs";
import { readProposals } from "../scripts/concepts/lib/inbox.mjs";
import { readHeartbeat } from "../scripts/concepts/lib/heartbeat.mjs";
import { REPO_ROOT } from "../scripts/concepts/lib/pipeline-home.mjs";
import { CONCEPTS_DIR, loadConcepts } from "../src/lib/knowledge/conceptAliases.ts";

// A real concept slug so fixture sections can alias-resolve against the
// committed registry without hardcoding registry contents.
const REAL_CONCEPT = loadConcepts(path.join(REPO_ROOT, CONCEPTS_DIR))[0].slug;

// Fixture keys/labels deliberately outside any plausible concept vocabulary.
const NOISE = "zz-fixture";

async function riderSandbox(t) {
  const dir = await mkdtemp(path.join(os.tmpdir(), "concepts-rider-"));
  t.after(() => rm(dir, { recursive: true, force: true }));
  const home = path.join(dir, "pipeline-home");
  const explorersPath = path.join(dir, "explorers.json");
  const env = {
    CONCEPTS_RIDER: "1",
    CONCEPTS_PIPELINE_HOME: home,
    CONCEPTS_HEARTBEAT_PATH: path.join(dir, "heartbeat.json"),
    CONCEPTS_EXPLORERS_PATH: explorersPath,
  };
  return { dir, home, explorersPath, env };
}

function fixtureExplorer(sections) {
  // sections: [{key, label, papers: [ids]}]
  return {
    id: "fixture-explorer",
    sections: sections.map(({ key, label }) => ({ key, label, summary: `${label} summary` })),
    papers: sections.flatMap(({ key, papers }) =>
      papers.map((id) => ({ bibcode: id, branches: [key] })),
    ),
  };
}

async function writeExplorers(explorersPath, sections) {
  await writeFile(explorersPath, JSON.stringify({ source: "test", explorers: [fixtureExplorer(sections)] }), "utf8");
}

async function writeSnapshot(home, sections) {
  const stateDir = path.join(home, "state");
  await mkdir(stateDir, { recursive: true });
  await writeFile(
    path.join(stateDir, SNAPSHOT_FILENAME),
    JSON.stringify({
      version: 1,
      updatedAt: "2026-07-01T00:00:00.000Z",
      sections: sections.map((s) => ({ explorerId: "fixture-explorer", concept: null, summary: "", ...s })),
    }),
    "utf8",
  );
}

const papers = (prefix, n) => Array.from({ length: n }, (_, i) => `${prefix}${i + 1}`);
const quiet = () => {};

test("renamed section with >=80% paper overlap reconciles silently — no proposal", async (t) => {
  const { home, explorersPath, env } = await riderSandbox(t);
  const priorPapers = papers("p", 10);
  await writeSnapshot(home, [{ key: `${NOISE}-old-theme`, label: "Old Theme", papers: priorPapers }]);
  // Renamed key, 8 of 10 papers kept + 2 new: overlap 8/10 = 0.8, at threshold.
  await writeExplorers(explorersPath, [
    { key: `${NOISE}-renamed-theme`, label: "Renamed Theme", papers: [...priorPapers.slice(0, 8), "n1", "n2"] },
  ]);

  const result = await runRider({ env, log: quiet });

  assert.equal(result.outcome, "noop");
  assert.equal(result.proposals, 0);
  assert.deepEqual(await readProposals(path.join(home, "inbox.jsonl")), []);
  const snapshot = JSON.parse(await readFile(path.join(home, "state", SNAPSHOT_FILENAME), "utf8"));
  assert.deepEqual(snapshot.sections.map((s) => s.key), [`${NOISE}-renamed-theme`]);
  const hb = await readHeartbeat(env.CONCEPTS_HEARTBEAT_PATH);
  assert.deepEqual(hb.flags, { riderEnabled: true, riderOk: true });
});

test("genuinely new section produces exactly one proposal inbox entry", async (t) => {
  const { home, explorersPath, env } = await riderSandbox(t);
  const stablePapers = papers("s", 5);
  await writeSnapshot(home, [{ key: `${NOISE}-stable`, label: "Stable", papers: stablePapers }]);
  await writeExplorers(explorersPath, [
    { key: `${NOISE}-stable`, label: "Stable", papers: stablePapers },
    { key: `${NOISE}-brand-new`, label: "Brand New Theme", papers: papers("q", 4) },
  ]);

  const now = new Date("2026-07-04T12:00:00.000Z");
  const result = await runRider({ env, now, log: quiet });

  assert.equal(result.outcome, "ok");
  assert.equal(result.proposals, 1);
  const entries = await readProposals(path.join(home, "inbox.jsonl"));
  assert.equal(entries.length, 1);
  assert.equal(entries[0].source, "knowledge-sync-rider");
  assert.equal(entries[0].kind, "new-explorer-section");
  assert.deepEqual(entries[0].payload, {
    explorerId: "fixture-explorer",
    sectionKey: `${NOISE}-brand-new`,
    label: "Brand New Theme",
    summary: "Brand New Theme summary",
    paperCount: 4,
  });
  const hb = await readHeartbeat(env.CONCEPTS_HEARTBEAT_PATH);
  assert.equal(hb.backlog.count, 1);
});

test("below-threshold overlap on a changed key is a new section, not a reconcile", async (t) => {
  const { home, explorersPath, env } = await riderSandbox(t);
  const priorPapers = papers("p", 10);
  await writeSnapshot(home, [{ key: `${NOISE}-old`, label: "Old", papers: priorPapers }]);
  // 7 of 10 kept = 0.7 < 0.8 with a changed key -> proposal.
  await writeExplorers(explorersPath, [
    { key: `${NOISE}-drifted`, label: "Drifted", papers: [...priorPapers.slice(0, 7), "n1", "n2", "n3"] },
  ]);

  const result = await runRider({ env, log: quiet });
  assert.equal(result.proposals, 1);
});

test("membership churn on a stable key is the same section — no proposal", async (t) => {
  const { home, explorersPath, env } = await riderSandbox(t);
  await writeSnapshot(home, [{ key: `${NOISE}-stable`, label: "Stable", papers: papers("p", 10) }]);
  // Same key, completely different papers: identity holds by key.
  await writeExplorers(explorersPath, [{ key: `${NOISE}-stable`, label: "Stable", papers: papers("x", 6) }]);

  const result = await runRider({ env, log: quiet });
  assert.equal(result.proposals, 0);
});

test("alias-resolving new section maps to its concept instead of a proposal", async (t) => {
  const { home, explorersPath, env } = await riderSandbox(t);
  await writeSnapshot(home, []);
  await writeExplorers(explorersPath, [{ key: REAL_CONCEPT, label: "Whatever Label", papers: papers("p", 3) }]);

  const result = await runRider({ env, log: quiet });

  assert.equal(result.proposals, 0);
  const membership = JSON.parse(await readFile(path.join(home, "state", MEMBERSHIP_FILENAME), "utf8"));
  assert.deepEqual(membership.memberships, [
    { concept: REAL_CONCEPT, explorerId: "fixture-explorer", sectionKey: REAL_CONCEPT, paperCount: 3 },
  ]);
  const hb = await readHeartbeat(env.CONCEPTS_HEARTBEAT_PATH);
  assert.deepEqual(hb.facetResolution, { resolved: 1, total: 1, rate: 1 });
});

test("bootstrap run (no prior snapshot) writes the snapshot and proposes nothing", async (t) => {
  const { home, explorersPath, env } = await riderSandbox(t);
  await writeExplorers(explorersPath, [{ key: `${NOISE}-unmapped`, label: "Unmapped", papers: papers("p", 3) }]);

  const result = await runRider({ env, log: quiet });

  assert.equal(result.outcome, "bootstrap");
  assert.equal(result.proposals, 0);
  assert.deepEqual(await readProposals(path.join(home, "inbox.jsonl")), []);
  const snapshot = JSON.parse(await readFile(path.join(home, "state", SNAPSHOT_FILENAME), "utf8"));
  assert.equal(snapshot.sections.length, 1);
});

test("disabled flag records the disabled state without touching the pipeline home", async (t) => {
  const { home, env } = await riderSandbox(t);
  const now = new Date("2026-07-04T12:00:00.000Z");

  const result = await runRider({ env: { ...env, CONCEPTS_RIDER: "0" }, now, log: quiet });

  assert.equal(result.outcome, "disabled");
  const hb = await readHeartbeat(env.CONCEPTS_HEARTBEAT_PATH);
  assert.deepEqual(hb.flags, { riderEnabled: false });
  assert.deepEqual(hb.steps["knowledge-sync-rider"], { lastRunAt: now.toISOString() });
  await assert.rejects(access(home), /ENOENT/);
});

test("malformed explorers file fails the run; recordRiderFailure stamps riderOk=false", async (t) => {
  const { explorersPath, env } = await riderSandbox(t);
  await writeFile(explorersPath, "{ not json", "utf8");

  await assert.rejects(runRider({ env, log: quiet }), /malformed explorers JSON/);

  await recordRiderFailure({ env, log: quiet });
  const hb = await readHeartbeat(env.CONCEPTS_HEARTBEAT_PATH);
  assert.deepEqual(hb.flags, { riderEnabled: true, riderOk: false });
});

test("loadExplorers rejects structural drift with context", async (t) => {
  const { explorersPath } = await riderSandbox(t);
  await writeFile(
    explorersPath,
    JSON.stringify({ explorers: [{ id: "e1", sections: [], papers: [{ bibcode: null, title: "", branches: [] }] }] }),
    "utf8",
  );
  await assert.rejects(loadExplorers(explorersPath), /identity field/);
});

test("paperId falls back bibcode -> arxiv -> url -> title", () => {
  assert.equal(paperId({ bibcode: "B", arxiv: "A", url: "U", title: "T" }), "B");
  assert.equal(paperId({ bibcode: null, arxiv: "A" }), "A");
  assert.equal(paperId({ bibcode: null, arxiv: null, url: "U" }), "U");
  assert.equal(paperId({ title: "T" }), "T");
  assert.equal(paperId({ title: "  " }), null);
});

test("overlapRatio is containment of current in prior", () => {
  const cur = new Set(["a", "b", "c", "d"]);
  assert.equal(overlapRatio(cur, new Set(["a", "b", "c", "d", "e"])), 1); // split child
  assert.equal(overlapRatio(cur, new Set(["a", "b", "x", "y"])), 0.5);
  assert.equal(overlapRatio(new Set(), new Set(["a"])), 0); // empty current never matches
});
