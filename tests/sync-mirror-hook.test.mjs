// Integration: the CONCEPTS_MIRROR step inside the REAL sync-knowledge.sh
// EXIT trap. Same shim strategy as sync-rider-hook.test.mjs — python3 exits 3
// (no-candidates early exit) so the trap fires immediately; git is a no-op.
// The vault root points at a nonexistent temp path, so the mirror step fails
// with "unreachable" — the sync's own exit code must stay 0.
import { test } from "node:test";
import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { chmod, mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { promisify } from "node:util";
import os from "node:os";
import path from "node:path";
import { REPO_ROOT } from "../scripts/concepts/lib/pipeline-home.mjs";

const run = promisify(execFile);
const SYNC_SCRIPT = path.join(REPO_ROOT, "scripts", "knowledge", "sync-knowledge.sh");

async function stub(dir, name, script) {
  const file = path.join(dir, name);
  await writeFile(file, `#!/bin/sh\n${script}\n`, "utf8");
  await chmod(file, 0o755);
}

async function mirrorSandbox(t) {
  const dir = await mkdtemp(path.join(os.tmpdir(), "sync-mirror-hook-"));
  const fakeDate = `0000-mirror-${path.basename(dir).slice(-6)}`;
  const syncDir = path.join(REPO_ROOT, ".knowledge-sync", fakeDate);
  t.after(async () => {
    await rm(dir, { recursive: true, force: true });
    await rm(syncDir, { recursive: true, force: true });
  });

  const stubDir = path.join(dir, "bin");
  await mkdir(stubDir);
  await stub(stubDir, "python3", "exit 3"); // no candidates: early-exit path
  await stub(stubDir, "git", "exit 0");

  const env = {
    ...process.env,
    PATH: `${stubDir}${path.delimiter}${process.env.PATH}`,
    WEBSITE_DIR: REPO_ROOT,
    CONCEPTS_PIPELINE_HOME: path.join(dir, "pipeline-home"),
    CONCEPTS_HEARTBEAT_PATH: path.join(dir, "heartbeat.json"),
    CONCEPTS_EXPLORERS_PATH: path.join(dir, "explorers.json"),
    KNOWLEDGE_SYNC_PUSH: "0",
  };
  return { dir, env, fakeDate };
}

async function runSync(env, fakeDate) {
  try {
    const { stdout } = await run("bash", [SYNC_SCRIPT, "--date", fakeDate], { env });
    return { code: 0, stdout };
  } catch (err) {
    return { code: err.code, stdout: err.stdout ?? "" };
  }
}

test("mirror step is OFF by default: sync logs the disabled state and exits 0", async (t) => {
  const { env, fakeDate } = await mirrorSandbox(t);
  const { code, stdout } = await runSync(env, fakeDate);
  assert.equal(code, 0, stdout);
  assert.match(stdout, /concepts mirror disabled \(CONCEPTS_MIRROR!=1\)/);
});

test("vault unreachable: mirror step non-zero, sync completes, sync exit code unchanged", async (t) => {
  const { dir, env, fakeDate } = await mirrorSandbox(t);
  env.CONCEPTS_MIRROR = "1";
  env.CONCEPTS_MIRROR_CONFIRM = "1";
  env.CONCEPTS_VAULT_ROOT = path.join(dir, "vault-not-mounted");

  const { code, stdout } = await runSync(env, fakeDate);

  assert.equal(code, 0, `mirror failure must never change the sync exit code\n${stdout}`);
  assert.match(stdout, /not reachable/);
  assert.match(stdout, /concepts mirror FAILED \(exit 1\) — sync steps unaffected/);
  // The rest of the trap still ran after the mirror failure.
  assert.match(stdout, /concepts rider done/);
  assert.match(stdout, /no research candidates/);
});

test("misconfigured mirror (no confirm env) also leaves the sync exit code alone", async (t) => {
  const { dir, env, fakeDate } = await mirrorSandbox(t);
  env.CONCEPTS_MIRROR = "1";
  env.CONCEPTS_VAULT_ROOT = path.join(dir, "vault-not-mounted");
  // CONCEPTS_MIRROR_CONFIRM deliberately unset: --write must be refused.

  const { code, stdout } = await runSync(env, fakeDate);

  assert.equal(code, 0, stdout);
  assert.match(stdout, /CONCEPTS_MIRROR_CONFIRM=1/);
  assert.match(stdout, /concepts mirror FAILED \(exit 2\) — sync steps unaffected/);
});
