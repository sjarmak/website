// Tests for the on-demand concepts backfill pipeline
// (scripts/knowledge/concepts_{prep,assign,validate}.mjs).
//
// Every run uses a temp CONCEPTS_PIPELINE_HOME — the real pipeline home is
// never touched — and every LLM invocation is a mock command; no test calls
// a real model. Repo-integrity tests run against the real repo inputs
// read-only and assert `git diff` / `git status` stay clean.

import { test } from "node:test";
import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { mkdtemp, mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";
import { readProposals } from "../scripts/concepts/lib/inbox.mjs";
import { EXIT_NOOP } from "../scripts/knowledge/concepts_common.mjs";
import { checkAssignments, mergeAssignments } from "../scripts/knowledge/concepts_validate.mjs";

const execFileP = promisify(execFile);
const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SCRIPTS = path.join(REPO_ROOT, "scripts", "knowledge");

// Run a pipeline script as a child process; never throws on non-zero exit.
async function runScript(script, args, home) {
  try {
    const { stdout, stderr } = await execFileP(
      process.execPath,
      [path.join(SCRIPTS, script), ...args],
      { env: { ...process.env, CONCEPTS_PIPELINE_HOME: home }, cwd: REPO_ROOT },
    );
    return { code: 0, stdout, stderr };
  } catch (err) {
    if (typeof err.code !== "number") throw err;
    return { code: err.code, stdout: err.stdout, stderr: err.stderr };
  }
}

// Names of any uncommitted files under the paths the pipeline must never
// write to. Asks git for the file list rather than the diff text: explorers.json
// is a single ~800KB line, so `git diff` over src/data/knowledge/ can exceed
// execFile's 1MB default buffer and mask the assertion behind a RangeError.
async function dirtyCommittedPaths() {
  const { stdout } = await execFileP(
    "git",
    ["diff", "--name-only", "--", "src/data/knowledge/", "src/content/concepts/"],
    { cwd: REPO_ROOT },
  );
  return stdout.trim();
}

async function tempDir(t, label) {
  const dir = await mkdtemp(path.join(os.tmpdir(), `concepts-backfill-${label}-`));
  t.after(() => rm(dir, { recursive: true, force: true }));
  return dir;
}

// Hermetic fixture: two concepts, one digest with one resolved + one
// unresolved topic, one thread and one explorer section that don't resolve.
async function makeFixture(t) {
  const root = await tempDir(t, "fixture");
  const digestDir = path.join(root, "digest");
  const dataDir = path.join(root, "data");
  const conceptsDir = path.join(root, "concepts");
  await mkdir(digestDir, { recursive: true });
  await mkdir(dataDir, { recursive: true });
  await mkdir(conceptsDir, { recursive: true });

  await writeFile(
    path.join(conceptsDir, "agent-memory.md"),
    `---\nlabel: "Agent memory"\naliases: [memory-systems]\ndefinition: "How agents remember."\n---\n`,
  );
  await writeFile(
    path.join(conceptsDir, "retrieval.md"),
    `---\nlabel: "Retrieval"\ndefinition: "Finding relevant context."\n---\n`,
  );
  await writeFile(
    path.join(digestDir, "daily-2026-07-01.md"),
    `---\ntitle: "Test digest"\ntopics:\n  - memory-systems\n  - quantum-agents\n---\nBody.\n`,
  );
  await writeFile(
    path.join(dataDir, "threads.json"),
    JSON.stringify({ threads: [{ id: "test-thread", concepts: ["retrieval", "swarm-planning"] }] }) + "\n",
  );
  await writeFile(
    path.join(dataDir, "explorers.json"),
    JSON.stringify({
      explorers: [{ id: "test-explorer", sections: [{ key: "s1", label: "Quantum Agents" }] }],
    }) + "\n",
  );

  const home = path.join(root, "home");
  const dirArgs = ["--digest-dir", digestDir, "--data-dir", dataDir, "--concepts-dir", conceptsDir];
  return { root, digestDir, dataDir, conceptsDir, home, dirArgs };
}

async function readCandidates(home) {
  return JSON.parse(await readFile(path.join(home, "state", "backfill-candidates.json"), "utf8"));
}

// Mock LLM: consume stdin (the prompt), emit a canned response file. Never a
// real model.
function mockLlmCmd(responsePath) {
  return `cat > /dev/null; cat ${JSON.stringify(responsePath)}`;
}

test("prep collects only unresolved facets, writes to the pipeline home state dir", async (t) => {
  const fx = await makeFixture(t);
  const result = await runScript("concepts_prep.mjs", fx.dirArgs, fx.home);
  assert.equal(result.code, 0, result.stderr);

  const { stats, candidates } = await readCandidates(fx.home);
  const facets = candidates.map((c) => c.facet);
  // memory-systems (alias) and retrieval (slug) resolve; the other two do not.
  assert.deepEqual(facets, ["quantum-agents", "swarm-planning"]);
  assert.equal(stats.facetsSeen, 4);
  assert.equal(stats.facetsResolved, 2);

  const quantum = candidates.find((c) => c.facet === "quantum-agents");
  // Same normalized facet from a digest topic and an explorer section label.
  assert.deepEqual(quantum.sources, [
    { kind: "digest", id: "daily-2026-07-01" },
    { kind: "explorer", id: "test-explorer#s1" },
  ]);
  assert.deepEqual(quantum.variants, ["quantum-agents", "Quantum Agents"]);
});

test("prep exits with the clean no-op code (3) when nothing changed since the last run", async (t) => {
  const fx = await makeFixture(t);
  const first = await runScript("concepts_prep.mjs", fx.dirArgs, fx.home);
  assert.equal(first.code, 0, first.stderr);

  const second = await runScript("concepts_prep.mjs", fx.dirArgs, fx.home);
  assert.equal(second.code, EXIT_NOOP, second.stderr);
  assert.match(second.stdout, /nothing new/);

  // A source change revives the pipeline.
  await writeFile(
    path.join(fx.digestDir, "daily-2026-07-02.md"),
    `---\ntitle: "Another digest"\ntopics:\n  - neuromorphic-tooling\n---\nBody.\n`,
  );
  const third = await runScript("concepts_prep.mjs", fx.dirArgs, fx.home);
  assert.equal(third.code, 0, third.stderr);
});

test("prep exits 3 when every facet resolves (nothing to consider)", async (t) => {
  const fx = await makeFixture(t);
  // Make everything resolve: add the unresolved facets as aliases.
  await writeFile(
    path.join(fx.conceptsDir, "agent-memory.md"),
    `---\nlabel: "Agent memory"\naliases: [memory-systems, quantum-agents, swarm-planning]\ndefinition: "x"\n---\n`,
  );
  const result = await runScript("concepts_prep.mjs", fx.dirArgs, fx.home);
  assert.equal(result.code, EXIT_NOOP, result.stderr);
  assert.match(result.stdout, /nothing to do/);
});

test("assign routes assignments to review/ and registry proposals to the inbox", async (t) => {
  const fx = await makeFixture(t);
  assert.equal((await runScript("concepts_prep.mjs", fx.dirArgs, fx.home)).code, 0);

  const response = path.join(fx.root, "llm-response.json");
  await writeFile(
    response,
    JSON.stringify({
      decisions: [
        { facet: "quantum-agents", action: "assign", concept: "agent-memory", reason: "test" },
        { facet: "swarm-planning", action: "new-concept", label: "Swarm planning", definition: "Def.", reason: "t" },
      ],
    }),
  );
  const result = await runScript(
    "concepts_assign.mjs",
    ["--llm-cmd", mockLlmCmd(response), "--concepts-dir", fx.conceptsDir],
    fx.home,
  );
  assert.equal(result.code, 0, result.stderr);

  const review = JSON.parse(await readFile(path.join(fx.home, "review", "backfill-assignments.json"), "utf8"));
  assert.equal(review.promptVersion, "v1");
  assert.deepEqual(review.facetResolution, { resolved: 2, total: 4 });
  assert.deepEqual(review.counts, { assign: 1, alias: 0, newConcept: 1, assignments: 1 });
  // The explorer source of quantum-agents must NOT become an assignment row.
  assert.deepEqual(review.assignments, [
    { id: "digest:daily-2026-07-01", concept: "agent-memory", facet: "quantum-agents" },
  ]);

  const proposals = await readProposals(path.join(fx.home, "inbox.jsonl"));
  assert.equal(proposals.length, 1);
  assert.equal(proposals[0].source, "backfill");
  assert.equal(proposals[0].kind, "new-concept");
  assert.equal(proposals[0].payload.label, "Swarm planning");
  assert.deepEqual(proposals[0].payload.sources, [{ kind: "thread", id: "test-thread" }]);
});

test("assign rejects assignment outside the controlled vocabulary and explorer-only assigns", async (t) => {
  const fx = await makeFixture(t);
  assert.equal((await runScript("concepts_prep.mjs", fx.dirArgs, fx.home)).code, 0);

  const cases = [
    [{ facet: "quantum-agents", action: "assign", concept: "not-a-real-slug" }, /not in the controlled vocabulary/],
    [{ facet: "quantum-agents", action: "assign", concept: "agent-memory", extra: true }, /no decision for candidate/],
  ];
  for (const [decision, pattern] of cases) {
    const response = path.join(fx.root, "bad-response.json");
    await writeFile(response, JSON.stringify({ decisions: [decision] }));
    const result = await runScript(
      "concepts_assign.mjs",
      ["--llm-cmd", mockLlmCmd(response), "--concepts-dir", fx.conceptsDir],
      fx.home,
    );
    assert.equal(result.code, 1);
    assert.match(result.stderr, pattern);
  }
  // Nothing was written on failure.
  const reviewFiles = await readdir(path.join(fx.home, "review"));
  assert.deepEqual(reviewFiles, []);
  assert.deepEqual(await readProposals(path.join(fx.home, "inbox.jsonl")), []);
});

test("a kill mid-LLM-pass leaves the repo and the pipeline home clean", async (t) => {
  const fx = await makeFixture(t);
  assert.equal((await runScript("concepts_prep.mjs", fx.dirArgs, fx.home)).code, 0);

  // Mock LLM that dies partway through emitting its answer (consumes the
  // prompt first so the failure is deterministically mid-output, not EPIPE).
  const dying = `cat > /dev/null; printf '{"decisions": [{"facet": "quantum-'; exit 137`;
  const result = await runScript(
    "concepts_assign.mjs",
    ["--llm-cmd", dying, "--concepts-dir", fx.conceptsDir],
    fx.home,
  );
  assert.notEqual(result.code, 0);
  assert.match(result.stderr, /exited 137|not valid JSON/);

  // Nothing landed in review/ or the inbox.
  assert.deepEqual(await readdir(path.join(fx.home, "review")), []);
  assert.deepEqual(await readProposals(path.join(fx.home, "inbox.jsonl")), []);

  // Committed files untouched (acceptance criterion).
  assert.equal(await dirtyCommittedPaths(), "", "pipeline must not modify committed paths");
});

test("prep + assign against the real repo leaves the repo tree unchanged", async (t) => {
  const home = await tempDir(t, "realrepo");
  const before = (await execFileP("git", ["status", "--porcelain"], { cwd: REPO_ROOT })).stdout;

  // Prep reads the real digests/threads/explorers/concepts read-only.
  const prep = await runScript("concepts_prep.mjs", [], home);
  assert.ok(prep.code === 0 || prep.code === EXIT_NOOP, prep.stderr);

  if (prep.code === EXIT_NOOP) {
    // No unresolved facets in the real data right now: seed a candidate so the
    // assign stage still executes against the real registry.
    await mkdir(path.join(home, "state"), { recursive: true });
    await writeFile(
      path.join(home, "state", "backfill-candidates.json"),
      JSON.stringify({
        generatedAt: new Date().toISOString(),
        stats: { facetsSeen: 1, facetsResolved: 0 },
        candidates: [
          {
            facet: "zz-backfill-test-facet",
            variants: ["zz-backfill-test-facet"],
            sources: [{ kind: "thread", id: "navigable-science" }],
          },
        ],
      }) + "\n",
    );
  }
  const { candidates } = await readCandidates(home);

  // Mock decisions: every candidate becomes a new-concept proposal.
  const response = path.join(home, "llm-response.json");
  await writeFile(
    response,
    JSON.stringify({
      decisions: candidates.map((c) => ({
        facet: c.facet,
        action: "new-concept",
        label: `ZZ test ${c.facet}`,
        definition: "Test definition.",
        reason: "test",
      })),
    }),
  );
  const assign = await runScript("concepts_assign.mjs", ["--llm-cmd", mockLlmCmd(response)], home);
  assert.equal(assign.code, 0, assign.stderr);

  // Proposals landed in the pipeline-home inbox, not the repo.
  const proposals = await readProposals(path.join(home, "inbox.jsonl"));
  assert.equal(proposals.length, candidates.length);

  const after = (await execFileP("git", ["status", "--porcelain"], { cwd: REPO_ROOT })).stdout;
  assert.equal(after, before, "repo tree must be unchanged after prep+assign");
  assert.equal(await dirtyCommittedPaths(), "", "pipeline must not modify committed paths");
});

test("validate passes valid assignments, and --apply writes assignments + heartbeat to the data dir", async (t) => {
  const fx = await makeFixture(t);
  assert.equal((await runScript("concepts_prep.mjs", fx.dirArgs, fx.home)).code, 0);
  const response = path.join(fx.root, "llm-response.json");
  await writeFile(
    response,
    JSON.stringify({
      decisions: [
        { facet: "quantum-agents", action: "assign", concept: "agent-memory", reason: "t" },
        { facet: "swarm-planning", action: "alias", concept: "retrieval", reason: "t" },
      ],
    }),
  );
  assert.equal(
    (await runScript("concepts_assign.mjs", ["--llm-cmd", mockLlmCmd(response), "--concepts-dir", fx.conceptsDir], fx.home)).code,
    0,
  );

  // Dry run: valid, writes nothing.
  const dry = await runScript("concepts_validate.mjs", fx.dirArgs, fx.home);
  assert.equal(dry.code, 0, dry.stderr);
  assert.match(dry.stdout, /dry run/);
  await assert.rejects(readFile(path.join(fx.dataDir, "concept-assignments.json")), { code: "ENOENT" });

  // Explicit apply: assignments + heartbeat written into the (temp) data dir.
  const apply = await runScript("concepts_validate.mjs", [...fx.dirArgs, "--apply"], fx.home);
  assert.equal(apply.code, 0, apply.stderr);
  const written = JSON.parse(await readFile(path.join(fx.dataDir, "concept-assignments.json"), "utf8"));
  assert.deepEqual(written.assignments, [
    { id: "digest:daily-2026-07-01", concept: "agent-memory", facet: "quantum-agents" },
  ]);
  const heartbeat = JSON.parse(await readFile(path.join(fx.dataDir, "concept-sync-status.json"), "utf8"));
  assert.ok(heartbeat.steps["backfill-apply"], "heartbeat records the apply step");
  assert.equal(heartbeat.backlog.count, 1); // the alias proposal sits in the inbox
  assert.deepEqual(heartbeat.facetResolution, { resolved: 2, total: 4, rate: 0.5 });
});

test("validate aborts without writing on bad slugs, bad ids, or count drift", async (t) => {
  const fx = await makeFixture(t);
  assert.equal((await runScript("concepts_prep.mjs", fx.dirArgs, fx.home)).code, 0);
  const bad = {
    generatedAt: new Date().toISOString(),
    promptVersion: "v1",
    facetResolution: { resolved: 2, total: 4 },
    counts: { assign: 1, alias: 0, newConcept: 0, assignments: 2 }, // drifted count
    assignments: [
      { id: "digest:daily-2026-07-01", concept: "no-such-concept", facet: "quantum-agents" },
      { id: "explorer:test-explorer#s1", concept: "agent-memory", facet: "quantum-agents" },
      { id: "thread:ghost-thread", concept: "retrieval", facet: "quantum-agents" },
    ],
  };
  await mkdir(path.join(fx.home, "review"), { recursive: true });
  await writeFile(path.join(fx.home, "review", "backfill-assignments.json"), JSON.stringify(bad) + "\n");

  const result = await runScript("concepts_validate.mjs", [...fx.dirArgs, "--apply"], fx.home);
  assert.equal(result.code, 1);
  assert.match(result.stderr, /unknown concept slug/);
  assert.match(result.stderr, /not an immutable/);
  assert.match(result.stderr, /does not exist/);
  assert.match(result.stderr, /counts\.assignments/);
  assert.match(result.stderr, /no committed files touched/);
  await assert.rejects(readFile(path.join(fx.dataDir, "concept-assignments.json")), { code: "ENOENT" });
  await assert.rejects(readFile(path.join(fx.dataDir, "concept-sync-status.json")), { code: "ENOENT" });
});

test("mergeAssignments dedupes pairs and sorts deterministically", () => {
  const existing = [{ id: "digest:b", concept: "x", facet: "f1" }];
  const merged = mergeAssignments(existing, [
    { id: "digest:a", concept: "y", facet: "f2" },
    { id: "digest:b", concept: "x", facet: "f1" },
  ]);
  assert.deepEqual(merged.map((r) => r.id), ["digest:a", "digest:b"]);
  assert.equal(merged.length, 2);
});

test("checkAssignments accepts a well-formed file", () => {
  const errors = checkAssignments(
    {
      promptVersion: "v1",
      facetResolution: { resolved: 1, total: 2 },
      counts: { assign: 1, assignments: 1 },
      assignments: [{ id: "thread:t1", concept: "c1", facet: "f1" }],
    },
    { conceptSlugs: new Set(["c1"]), digests: new Set(), threads: new Set(["t1"]) },
  );
  assert.deepEqual(errors, []);
});

test("no cron or scheduler path references the concepts_ entrypoints", async () => {
  for (const orchestrator of ["scripts/knowledge/sync-knowledge.sh", "scripts/digest/run.sh"]) {
    const text = await readFile(path.join(REPO_ROOT, orchestrator), "utf8");
    assert.ok(!/concepts_(prep|assign|validate)/.test(text), `${orchestrator} must not invoke the backfill`);
  }
});
