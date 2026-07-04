// Canary check: salted-hash detection of vault-distinctive tokens in trees
// that are about to be committed or published. All tokens here are synthetic
// fixture strings, and the canary file lives in a temp pipeline home.
import { test } from "node:test";
import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { promisify } from "node:util";
import os from "node:os";
import path from "node:path";
import { REPO_ROOT } from "../scripts/concepts/lib/pipeline-home.mjs";
import { buildCanary, canaryPath, countMatches } from "../scripts/concepts/canary-check.mjs";

const run = promisify(execFile);
const CANARY = path.join(REPO_ROOT, "scripts", "concepts", "canary-check.mjs");
const TOKENS = ["zzyzx-fixture-token", "synthetic canary phrase"];

async function canarySandbox(t, { withCanary = true } = {}) {
  const dir = await mkdtemp(path.join(os.tmpdir(), "canary-check-"));
  t.after(() => rm(dir, { recursive: true, force: true }));
  const home = path.join(dir, "pipeline-home");
  await mkdir(home, { recursive: true });
  if (withCanary) {
    await writeFile(canaryPath(home), `${JSON.stringify(buildCanary(TOKENS, "fixture-salt"))}\n`, "utf8");
  }
  const env = { ...process.env, CONCEPTS_PIPELINE_HOME: home };
  return { dir, home, env };
}

async function runCanary(env, args, cwd = REPO_ROOT) {
  try {
    const { stdout, stderr } = await run(process.execPath, [CANARY, ...args], { env, cwd });
    return { code: 0, out: stdout + stderr };
  } catch (err) {
    return { code: err.code, out: `${err.stdout ?? ""}${err.stderr ?? ""}` };
  }
}

test("hashing round-trip: normalized 1-3-gram tokens match regardless of case/punctuation", () => {
  const canary = buildCanary(TOKENS, "fixture-salt");
  assert.equal(countMatches("nothing suspicious here", canary), 0);
  assert.equal(countMatches("prefix ZZYZX-Fixture-Token suffix", canary), 1);
  assert.equal(countMatches("a Synthetic Canary Phrase, twice: synthetic canary phrase", canary), 1);
  assert.throws(() => buildCanary(["one two three four"]), /1–3-grams/);
  assert.throws(() => buildCanary(["", "  "]), /no tokens/);
});

test("clean tree passes, seeded canary-token fixture fails", async (t) => {
  const { dir, env } = await canarySandbox(t);
  const clean = path.join(dir, "clean");
  await mkdir(clean, { recursive: true });
  await writeFile(path.join(clean, "page.html"), "<p>ordinary site output</p>\n", "utf8");
  const pass = await runCanary(env, ["--paths", clean]);
  assert.equal(pass.code, 0, pass.out);
  assert.match(pass.out, /clean/);

  const seeded = path.join(dir, "seeded");
  await mkdir(path.join(seeded, "sub"), { recursive: true });
  await writeFile(path.join(seeded, "sub", "leak.md"), "notes mention zzyzx-fixture-token here\n", "utf8");
  const fail = await runCanary(env, ["--paths", seeded]);
  assert.equal(fail.code, 1, fail.out);
  assert.match(fail.out, /FAIL sub\/leak\.md: 1 canary token match/);
  assert.ok(!fail.out.includes("zzyzx"), "output must never echo the matched token");
});

test("--dist scans a built output dir", async (t) => {
  const { dir, env } = await canarySandbox(t);
  const dist = path.join(dir, "dist");
  await mkdir(dist, { recursive: true });
  await writeFile(path.join(dist, "index.html"), "Synthetic Canary Phrase leaked into the build\n", "utf8");
  const { code, out } = await runCanary(env, ["--dist", dist]);
  assert.equal(code, 1, out);
});

test("--staged scans the staged git tree (pre-commit usage)", async (t) => {
  const { dir, env } = await canarySandbox(t);
  const repo = path.join(dir, "repo");
  await mkdir(repo, { recursive: true });
  const g = (...args) => run("git", ["-C", repo, ...args]);
  await g("init", "-q");
  await g("config", "user.email", "t@t");
  await g("config", "user.name", "t");
  await writeFile(path.join(repo, "ok.md"), "harmless\n", "utf8");
  await g("add", "ok.md");
  const pass = await runCanary(env, ["--staged"], repo);
  assert.equal(pass.code, 0, pass.out);

  // Staged-but-uncommitted leak is caught even with a clean worktree HEAD.
  await writeFile(path.join(repo, "leak.md"), "contains zzyzx-fixture-token\n", "utf8");
  await g("add", "leak.md");
  await writeFile(path.join(repo, "leak.md"), "scrubbed on disk but still staged\n", "utf8");
  const fail = await runCanary(env, ["--staged"], repo);
  assert.equal(fail.code, 1, fail.out);
  assert.match(fail.out, /FAIL leak\.md/);
});

test("missing canary file is a notice, not a failure (unprovisioned machine)", async (t) => {
  const { dir, env } = await canarySandbox(t, { withCanary: false });
  const tree = path.join(dir, "tree");
  await mkdir(tree, { recursive: true });
  await writeFile(path.join(tree, "a.txt"), "zzyzx-fixture-token\n", "utf8");
  const { code, out } = await runCanary(env, ["--paths", tree]);
  assert.equal(code, 0, out);
  assert.match(out, /no canary file/);
});

test("--setup populates the canary file from stdin with salted hashes only", async (t) => {
  const { home, env } = await canarySandbox(t, { withCanary: false });
  await new Promise((resolve, reject) => {
    const child = execFile(process.execPath, [CANARY, "--setup"], { env, cwd: REPO_ROOT }, (err) =>
      err ? reject(err) : resolve(),
    );
    child.stdin.end(`${TOKENS.join("\n")}\n`);
  });
  const { readFile } = await import("node:fs/promises");
  const canary = JSON.parse(await readFile(canaryPath(home), "utf8"));
  assert.equal(canary.hashes.length, 2);
  const serialized = JSON.stringify(canary);
  for (const token of TOKENS) assert.ok(!serialized.includes(token), "tokens are never stored in cleartext");
  assert.equal(countMatches(`text with ${TOKENS[0]}`, canary), 1, "setup output detects the token");
});
