// Concept-resolution gate on the digest publish path (scripts/digest/concept-gate.mjs
// + its publish-digest.mjs integration).
//
// The end-to-end tests spawn publish-digest.mjs with cwd set to a temp
// mini-repo (git init + a copy of src/content/concepts, a heartbeat baseline,
// and a fixture digest entry) and CONCEPTS_PIPELINE_HOME pointing at a temp
// pipeline home — the committed heartbeat and the real digest collection are
// never touched.

import { test } from "node:test";
import assert from "node:assert/strict";
import { access, cp, mkdir, mkdtemp, readFile, rm, stat, writeFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import os from "node:os";
import path from "node:path";
import YAML from "yaml";
import { evaluateConceptGate, measureFacetResolution } from "../scripts/digest/concept-gate.mjs";

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const PUBLISH_SCRIPT = path.join(REPO_ROOT, "scripts", "digest", "publish-digest.mjs");
const HEARTBEAT_REL = path.join("src", "data", "knowledge", "concept-sync-status.json");

const FIXTURE_ENTRY = `---
title: Fixture issue
cadence: daily
track: specialized
origin: auto
date: 2026-07-02
summary: fixture baseline issue
topics:
  - agentic-coding
  - zzz-fixture-unknown
items: []
highlights: []
---

Fixture body.
`;

// Temp mini-repo: real concept vocabulary, empty-baseline heartbeat, one
// fixture issue contributing 1 resolved + 1 unresolved facet to the measure.
async function makeTempRepo(t) {
  const root = await mkdtemp(path.join(os.tmpdir(), "digest-gate-"));
  t.after(() => rm(root, { recursive: true, force: true }));

  const repo = path.join(root, "repo");
  const home = path.join(root, "pipeline-home");
  await mkdir(path.join(repo, "src", "content", "digest"), { recursive: true });
  await mkdir(path.join(repo, "src", "data", "knowledge"), { recursive: true });
  await cp(path.join(REPO_ROOT, "src", "content", "concepts"), path.join(repo, "src", "content", "concepts"), {
    recursive: true,
  });
  await cp(path.join(REPO_ROOT, HEARTBEAT_REL), path.join(repo, HEARTBEAT_REL));
  await writeFile(path.join(repo, "src", "content", "digest", "daily-2026-07-02.md"), FIXTURE_ENTRY, "utf8");

  const git = spawnSync("git", ["init", "-q"], { cwd: repo, encoding: "utf8" });
  assert.equal(git.status, 0, `git init failed: ${git.stderr}`);
  return { root, repo, home };
}

async function runPublish({ root, repo, home }, spec, { cron }) {
  const specPath = path.join(root, "spec.json");
  await writeFile(specPath, JSON.stringify(spec), "utf8");
  const env = { ...process.env, CONCEPTS_PIPELINE_HOME: home };
  delete env.DIGEST_CRON;
  delete env.DIGEST_REPEAT_GUARD_DAYS;
  if (cron) env.DIGEST_CRON = "1";
  return spawnSync(process.execPath, [PUBLISH_SCRIPT, "--spec", specPath], {
    cwd: repo,
    env,
    encoding: "utf8",
  });
}

function makeSpec(topics) {
  return {
    title: "Gate test issue",
    cadence: "daily",
    date: "2026-07-04",
    summary: "Concept-gate test issue.",
    topics,
    body: "Test body.",
  };
}

function parseFrontmatter(text) {
  const match = text.match(/^---\n([\s\S]*?)\n---/);
  assert.ok(match, "entry has a frontmatter block");
  return YAML.parse(match[1]);
}

async function exists(p) {
  try {
    await access(p);
    return true;
  } catch {
    return false;
  }
}

test("cron mode: unknown-only facets publish with unresolvedFacets, inbox proposals, heartbeat update", async (t) => {
  const ctx = await makeTempRepo(t);
  const spec = makeSpec(["zzz-flux-capacitors", "qqq-warp-drives"]);

  const r = await runPublish(ctx, spec, { cron: true });
  assert.equal(r.status, 0, `publish should succeed in cron mode; stderr:\n${r.stderr}`);

  // entry written, unresolved facets recorded in frontmatter
  const entryPath = path.join(ctx.repo, "src", "content", "digest", "daily-2026-07-04.md");
  const fm = parseFrontmatter(await readFile(entryPath, "utf8"));
  assert.deepEqual(fm.topics, spec.topics);
  assert.deepEqual(fm.unresolvedFacets, ["zzz-flux-capacitors", "qqq-warp-drives"]);

  // one proposal per facet in the temp pipeline-home inbox
  const inboxText = await readFile(path.join(ctx.home, "inbox.jsonl"), "utf8");
  const proposals = inboxText.trim().split("\n").map((l) => JSON.parse(l));
  assert.deepEqual(
    proposals.map((p) => ({ source: p.source, kind: p.kind, facet: p.payload.facet, issueSlug: p.payload.issueSlug })),
    spec.topics.map((facet) => ({ source: "digest-publish-gate", kind: "concept", facet, issueSlug: "daily-2026-07-04" }))
  );

  // heartbeat re-measured across all issues: fixture (1/2) + this issue (0/2)
  const hb = JSON.parse(await readFile(path.join(ctx.repo, HEARTBEAT_REL), "utf8"));
  assert.deepEqual(hb.facetResolution, { resolved: 1, total: 4, rate: 0.25 });
  assert.ok(hb.steps["digest-publish"]?.lastRunAt, "digest-publish step recorded");
});

test("interactive mode: unknown-only facets fail loudly, nothing written", async (t) => {
  const ctx = await makeTempRepo(t);
  const baselineHeartbeat = await readFile(path.join(ctx.repo, HEARTBEAT_REL), "utf8");

  const r = await runPublish(ctx, makeSpec(["zzz-flux-capacitors", "qqq-warp-drives"]), { cron: false });
  assert.notEqual(r.status, 0, "publish must exit non-zero in interactive mode");
  assert.match(r.stderr, /concept gate/);

  const entryPath = path.join(ctx.repo, "src", "content", "digest", "daily-2026-07-04.md");
  assert.equal(await exists(entryPath), false, "no entry written on gate failure");
  assert.equal(await exists(path.join(ctx.home, "inbox.jsonl")), false, "no inbox proposals on gate failure");
  assert.equal(await readFile(path.join(ctx.repo, HEARTBEAT_REL), "utf8"), baselineHeartbeat, "heartbeat untouched");
});

test("fully-resolved issue publishes exactly as before, plus the heartbeat refresh", async (t) => {
  const ctx = await makeTempRepo(t);
  const spec = makeSpec(["agentic-coding", "evals"]); // "evals" resolves via the evaluation alias

  const r = await runPublish(ctx, spec, { cron: true });
  assert.equal(r.status, 0, `publish should succeed; stderr:\n${r.stderr}`);

  // existing output contract unchanged
  const out = JSON.parse(r.stdout.trim().split("\n").at(-1));
  assert.equal(out.slug, "daily-2026-07-04");
  assert.equal(out.committed, false);

  // frontmatter identical to the pre-gate shape: no unresolvedFacets key
  const entryPath = path.join(ctx.repo, "src", "content", "digest", "daily-2026-07-04.md");
  const fm = parseFrontmatter(await readFile(entryPath, "utf8"));
  assert.deepEqual(fm.topics, spec.topics);
  assert.equal("unresolvedFacets" in fm, false);
  assert.equal(await exists(path.join(ctx.home, "inbox.jsonl")), false, "no proposals when everything resolves");

  // heartbeat updated on this publish too: fixture (1/2) + this issue (2/2)
  const hb = JSON.parse(await readFile(path.join(ctx.repo, HEARTBEAT_REL), "utf8"));
  assert.deepEqual(hb.facetResolution, { resolved: 3, total: 4, rate: 0.75 });
});

test("interactive mode: partially-resolved issue still publishes (gate only blocks at zero)", async (t) => {
  const ctx = await makeTempRepo(t);
  const r = await runPublish(ctx, makeSpec(["agentic-coding", "zzz-flux-capacitors"]), { cron: false });
  assert.equal(r.status, 0, `partial resolution must not block; stderr:\n${r.stderr}`);
  const fm = parseFrontmatter(
    await readFile(path.join(ctx.repo, "src", "content", "digest", "daily-2026-07-04.md"), "utf8")
  );
  assert.deepEqual(fm.unresolvedFacets, ["zzz-flux-capacitors"]);
  assert.equal(await exists(path.join(ctx.home, "inbox.jsonl")), false, "inbox proposals are cron-only");
});

// ---- side-effect failures must degrade to warnings, never crash a publish
// ---- (the entry is already on disk when they run) ----

test("cron mode: unwritable pipeline home degrades to a warning, publish still exits 0", async (t) => {
  const ctx = await makeTempRepo(t);
  await writeFile(ctx.home, "not a directory", "utf8"); // pipeline home is a FILE

  const spec = makeSpec(["zzz-flux-capacitors", "qqq-warp-drives"]);
  const r = await runPublish(ctx, spec, { cron: true });
  assert.equal(r.status, 0, `publish must survive a broken pipeline home; stderr:\n${r.stderr}`);
  assert.match(r.stderr, /WARNING: failed to file inbox proposals/);

  // entry written and complete, unresolved facets still recorded
  const fm = parseFrontmatter(
    await readFile(path.join(ctx.repo, "src", "content", "digest", "daily-2026-07-04.md"), "utf8")
  );
  assert.deepEqual(fm.unresolvedFacets, spec.topics);

  // the heartbeat itself was writable, so it still updated
  const hb = JSON.parse(await readFile(path.join(ctx.repo, HEARTBEAT_REL), "utf8"));
  assert.deepEqual(hb.facetResolution, { resolved: 1, total: 4, rate: 0.25 });
});

test("cron mode: fully-resolved issue with unwritable heartbeat warns, publishes, exits 0", async (t) => {
  const ctx = await makeTempRepo(t);
  const hbPath = path.join(ctx.repo, HEARTBEAT_REL);
  await rm(hbPath);
  await mkdir(hbPath); // heartbeat path is now a directory — unwritable

  const r = await runPublish(ctx, makeSpec(["agentic-coding", "evals"]), { cron: true });
  assert.equal(r.status, 0, `publish must survive an unwritable heartbeat; stderr:\n${r.stderr}`);
  assert.match(r.stderr, /WARNING: heartbeat facet-resolution update failed/);

  // publish output contract intact, entry on disk
  const out = JSON.parse(r.stdout.trim().split("\n").at(-1));
  assert.equal(out.slug, "daily-2026-07-04");
  const fm = parseFrontmatter(
    await readFile(path.join(ctx.repo, "src", "content", "digest", "daily-2026-07-04.md"), "utf8")
  );
  assert.equal("unresolvedFacets" in fm, false);

  // heartbeat left un-updated is the expected outcome of this failure case
  assert.equal((await stat(hbPath)).isDirectory(), true, "heartbeat path untouched");
});

test("cron mode: unresolved facets with BOTH side effects unwritable still publishes with both warnings", async (t) => {
  const ctx = await makeTempRepo(t);
  await writeFile(ctx.home, "not a directory", "utf8");
  const hbPath = path.join(ctx.repo, HEARTBEAT_REL);
  await rm(hbPath);
  await mkdir(hbPath);

  const r = await runPublish(ctx, makeSpec(["zzz-flux-capacitors"]), { cron: true });
  assert.equal(r.status, 0, `publish must survive both side effects failing; stderr:\n${r.stderr}`);
  assert.match(r.stderr, /WARNING: failed to file inbox proposals/);
  assert.match(r.stderr, /WARNING: heartbeat facet-resolution update failed/);
  const fm = parseFrontmatter(
    await readFile(path.join(ctx.repo, "src", "content", "digest", "daily-2026-07-04.md"), "utf8")
  );
  assert.deepEqual(fm.unresolvedFacets, ["zzz-flux-capacitors"]);
});

// ---- direct unit coverage (real committed vocabulary, cwd = repo root) ----

test("evaluateConceptGate resolves aliases and splits unresolved facets", () => {
  const logs = [];
  const gate = evaluateConceptGate(["evals", "agentic-coding", "zzz-not-a-concept"], {
    cron: true,
    log: (m) => logs.push(m),
  });
  assert.deepEqual(gate.resolved, ["evaluation", "agentic-coding"]);
  assert.deepEqual(gate.unresolvedFacets, ["zzz-not-a-concept"]);
  assert.equal(logs.length, 1);
});

test("evaluateConceptGate hard-fails interactively at zero resolution, warns in cron", () => {
  assert.throws(() => evaluateConceptGate(["zzz-nope"], { cron: false, log: () => {} }), /concept gate/);
  const logs = [];
  const gate = evaluateConceptGate(["zzz-nope"], { cron: true, log: (m) => logs.push(m) });
  assert.deepEqual(gate, { resolved: [], unresolvedFacets: ["zzz-nope"] });
  assert.equal(logs.length, 1);
});

test("evaluateConceptGate passes an empty facet list in both modes", () => {
  assert.deepEqual(evaluateConceptGate([], { cron: false }), { resolved: [], unresolvedFacets: [] });
  assert.deepEqual(evaluateConceptGate([], { cron: true }), { resolved: [], unresolvedFacets: [] });
});

test("measureFacetResolution counts topics across all issues in a directory", async (t) => {
  const dir = await mkdtemp(path.join(os.tmpdir(), "digest-measure-"));
  t.after(() => rm(dir, { recursive: true, force: true }));
  await writeFile(path.join(dir, "a.md"), FIXTURE_ENTRY, "utf8"); // 1 resolved / 2
  await writeFile(
    path.join(dir, "b.md"),
    "---\ntitle: b\ncadence: daily\ndate: 2026-07-03\nsummary: s\ntopics: [evals]\n---\n\nBody.\n",
    "utf8"
  ); // 1 resolved / 1
  await writeFile(path.join(dir, "notes.txt"), "ignored", "utf8");
  assert.deepEqual(await measureFacetResolution(dir), { resolved: 2, total: 3, rate: 2 / 3 });
});
