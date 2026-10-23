import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { cp, mkdir, mkdtemp, readFile, rm, symlink, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";
import { git, REPO_ROOT, runProcess } from "./helpers/digest-sandbox.mjs";

const RUN_DATE = "2026-10-23";
const STATUS = "src/data/models/refresh-status.json";
const STUB = path.join(REPO_ROOT, "tests", "helpers", "stub-models-agent.mjs");

function identify(repo) {
  git(repo, "config", "user.email", "sandbox@example.invalid");
  git(repo, "config", "user.name", "Models Sandbox");
  git(repo, "config", "commit.gpgsign", "false");
}

async function makeSandbox(t) {
  const root = await mkdtemp(path.join(os.tmpdir(), "models-run-"));
  t.after(() => rm(root, { recursive: true, force: true }));
  const seed = path.join(root, "seed");
  for (const dir of ["scripts/models", "src/data/models", "src/lib/models"]) {
    await cp(path.join(REPO_ROOT, dir), path.join(seed, dir), { recursive: true });
  }
  for (const file of ["package.json", "package-lock.json"]) await cp(path.join(REPO_ROOT, file), path.join(seed, file));
  await writeFile(path.join(seed, ".gitignore"), "node_modules\n.models-runs/\n");
  git(root, "init", "-q", "--bare", "-b", "main", "origin.git");
  git(seed, "init", "-q", "-b", "main");
  identify(seed);
  git(seed, "add", "-A");
  git(seed, "commit", "-q", "-m", "seed");
  git(seed, "push", "-q", path.join(root, "origin.git"), "main");
  const primary = path.join(root, "primary");
  git(root, "clone", "-q", path.join(root, "origin.git"), primary);
  identify(primary);
  const job = path.join(root, "job");
  git(primary, "worktree", "add", "-q", "-b", "models-daily", job, "origin/main");
  await symlink(path.join(REPO_ROOT, "node_modules"), path.join(job, "node_modules"));
  const lock = await readFile(path.join(job, "package-lock.json"));
  await mkdir(path.join(job, ".models-runs"));
  await writeFile(path.join(job, ".models-runs", "package-lock.sha256"), `${createHash("sha256").update(lock).digest("hex")}\n`);
  const catalog = path.join(root, "catalog");
  await mkdir(path.join(catalog, "lib"), { recursive: true });
  await writeFile(path.join(catalog, "lib", "models.ts"), "export const ids = ['claude-opus-5-5'];\n");
  git(catalog, "init", "-q", "-b", "main");
  identify(catalog);
  git(catalog, "add", "-A");
  git(catalog, "commit", "-q", "-m", "catalog");
  return { root, primary, job, catalog, origin: path.join(root, "origin.git") };
}

function runJob(sandbox, env = {}) {
  const base = { ...process.env };
  for (const name of Object.keys(base)) if (name.startsWith("MODELS_") || name === "CLAUDE_CONFIG_DIR") delete base[name];
  return runProcess("bash", [path.join(sandbox.job, "scripts", "models", "run.sh")], {
    cwd: sandbox.root,
    env: {
      ...base,
      MODELS_WEBSITE_DIR: sandbox.job,
      MODELS_RUN_DATE: RUN_DATE,
      MODELS_CATALOG_REPO: sandbox.catalog,
      MODELS_CATALOG_FILES: "lib/models.ts",
      MODELS_GATES_CMD: "true",
      CLAUDE_BIN: STUB,
      ...env,
    },
  }).done;
}

const status = async (sandbox) => JSON.parse(await readFile(path.join(sandbox.job, STATUS), "utf8"));
const changedFiles = (repo) => git(repo, "show", "--name-only", "--format=", "HEAD").split("\n").filter(Boolean);
const verdicts = JSON.stringify([{ model: "claude-opus-5.5", verdict: "in-catalog", citations: ["claude-opus-5-5"], reason: "listed" }]);

test("a changed run publishes data and status, and a repeat run records no change", async (t) => {
  const sandbox = await makeSandbox(t);
  const first = await runJob(sandbox, { MODELS_PUSH: "1", STUB_VERDICTS: verdicts });
  assert.equal(first.status, 0, first.stdout + first.stderr);
  assert.equal(git(sandbox.origin, "log", "-1", "--format=%s", "main"), `content(models): daily refresh ${RUN_DATE}`);
  assert.match(git(sandbox.origin, "log", "-1", "--format=%b", "main"), /^Why: /);
  const published = await status(sandbox);
  assert.equal(published.outcome, "published");
  assert.equal(published.lastSuccess, published.lastAttempt);
  assert.match(published.catalogCommit, /^[0-9a-f]{40}$/);
  const eligibility = JSON.parse(await readFile(path.join(sandbox.job, "src/data/models/omni-eligibility.json"), "utf8"));
  assert.equal(eligibility.find((e) => e.model === "claude-opus-5.5").verdict, "in-catalog");

  const second = await runJob(sandbox, { MODELS_PUSH: "1", STUB_VERDICTS: verdicts });
  assert.equal(second.status, 0, second.stdout + second.stderr);
  assert.equal(git(sandbox.origin, "log", "-1", "--format=%s", "main"), `chore(models): refresh found no change on ${RUN_DATE}`);
  assert.deepEqual(changedFiles(sandbox.job), [STATUS]);
  assert.equal((await status(sandbox)).outcome, "no-change");
});

test("failing gates exit 6, leave every data row alone and commit only the failed status", async (t) => {
  const sandbox = await makeSandbox(t);
  const before = git(sandbox.job, "rev-parse", "HEAD");
  const run = await runJob(sandbox, { MODELS_GATES_CMD: "false", STUB_VERDICTS: verdicts });
  assert.equal(run.status, 6, run.stdout + run.stderr);
  assert.equal(git(sandbox.job, "rev-list", "--count", `${before}..HEAD`), "1");
  assert.deepEqual(changedFiles(sandbox.job), [STATUS]);
  assert.equal(git(sandbox.job, "status", "--porcelain"), "");
  const failed = await status(sandbox);
  assert.deepEqual([failed.outcome, failed.failedStage, failed.exitCode, failed.lastSuccess], ["failed", "gates", 6, null]);
  assert.equal(git(sandbox.origin, "rev-parse", "main"), before);
});

test("an agent failure exits 4 and a missing catalog file exits 3, each recording the stage", async (t) => {
  const sandbox = await makeSandbox(t);
  const agent = await runJob(sandbox, { STUB_FAIL_PHASE: "eligibility" });
  assert.equal(agent.status, 4, agent.stdout + agent.stderr);
  assert.equal((await status(sandbox)).failedStage, "eligibility");
  const catalog = await runJob(sandbox, { MODELS_CATALOG_FILES: "lib/missing.ts" });
  assert.equal(catalog.status, 3, catalog.stdout + catalog.stderr);
  const recorded = await status(sandbox);
  assert.equal(recorded.failedStage, "catalog");
  assert.deepEqual(recorded.sources.find((s) => s.source === "omni-catalog"), {
    source: "omni-catalog",
    status: "failed",
    checked: recorded.lastAttempt,
    lastOk: null,
  });
});

test("a malformed research proposal exits 5", async (t) => {
  const sandbox = await makeSandbox(t);
  const run = await runJob(sandbox, { STUB_RESEARCH: JSON.stringify({ runDate: "1999-01-01" }) });
  assert.equal(run.status, 5, run.stdout + run.stderr);
  assert.equal((await status(sandbox)).failedStage, "research-proposals");
});

test("the account picker routes both agents to its account's config, and a refusal fails the research stage", async (t) => {
  const sandbox = await makeSandbox(t);
  const homes = path.join(sandbox.root, "homes");
  await mkdir(path.join(homes, "account2", ".claude"), { recursive: true });
  await writeFile(path.join(homes, "account2", ".claude", ".credentials.json"), "{}\n");
  const picker = path.join(sandbox.root, "picker.sh");
  await writeFile(picker, "#!/usr/bin/env bash\n[ -z \"$PICKER_REFUSE\" ] || exit 75\necho 2\n", { mode: 0o755 });
  const routed = await runJob(sandbox, { MODELS_ACCOUNT_PICKER: picker, MODELS_ACCOUNT_HOMES: homes, STUB_VERDICTS: verdicts });
  assert.equal(routed.status, 0, routed.stdout + routed.stderr);
  const config = path.join(homes, "account2", ".claude");
  assert.match(routed.stdout, new RegExp(`research config ${config}`));
  assert.match(routed.stdout, new RegExp(`eligibility config ${config}`));
  const refused = await runJob(sandbox, { MODELS_ACCOUNT_PICKER: picker, MODELS_ACCOUNT_HOMES: homes, PICKER_REFUSE: "1" });
  assert.equal(refused.status, 4, refused.stdout + refused.stderr);
  assert.match(refused.stdout, /account picker refused the launch/);
  assert.equal((await status(sandbox)).failedStage, "research");
});

test("the job refuses the primary checkout, a push from another base, and a held lock", async (t) => {
  const sandbox = await makeSandbox(t);
  const primary = await runJob(sandbox, { MODELS_WEBSITE_DIR: sandbox.primary });
  assert.equal(primary.status, 2);
  assert.match(primary.stderr, /primary checkout/);
  const push = await runJob(sandbox, { MODELS_PUSH: "1", MODELS_BASE_REF: "models-daily" });
  assert.equal(push.status, 2);
  assert.match(push.stderr, /MODELS_BASE_REF must be origin\/main/);
  const holder = runProcess("flock", [path.join(sandbox.job, ".models-runs", "run.lock"), "sleep", "5"], { cwd: sandbox.root, env: process.env });
  await new Promise((resolve) => setTimeout(resolve, 300));
  const busy = await runJob(sandbox, { MODELS_LOCK_WAIT_SEC: "0" });
  assert.equal(busy.status, 75);
  holder.child.kill();
  await holder.done;
});
