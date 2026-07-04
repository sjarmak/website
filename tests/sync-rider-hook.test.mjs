// Integration: the concepts-rider EXIT-trap hook inside the REAL
// scripts/knowledge/sync-knowledge.sh. Network- and repo-touching steps are
// stubbed via PATH shims (python3 for candidate extraction, git for the
// commit/push idioms) and CLAUDE_BIN, so the actual script runs end to end
// with zero side effects beyond a throwaway gitignored .knowledge-sync/<date>
// dir. Heartbeat and pipeline home point at temp copies.
import { test } from "node:test";
import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { chmod, mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { promisify } from "node:util";
import os from "node:os";
import path from "node:path";
import { readHeartbeat } from "../scripts/concepts/lib/heartbeat.mjs";
import { REPO_ROOT } from "../scripts/concepts/lib/pipeline-home.mjs";

const run = promisify(execFile);
const SYNC_SCRIPT = path.join(REPO_ROOT, "scripts", "knowledge", "sync-knowledge.sh");

async function stub(dir, name, script) {
  const file = path.join(dir, name);
  await writeFile(file, `#!/bin/sh\n${script}\n`, "utf8");
  await chmod(file, 0o755);
  return file;
}

async function syncSandbox(t) {
  const dir = await mkdtemp(path.join(os.tmpdir(), "sync-rider-hook-"));
  const fakeDate = `0000-rider-${path.basename(dir).slice(-6)}`;
  const syncDir = path.join(REPO_ROOT, ".knowledge-sync", fakeDate);
  t.after(async () => {
    await rm(dir, { recursive: true, force: true });
    await rm(syncDir, { recursive: true, force: true });
  });

  const stubDir = path.join(dir, "bin");
  await mkdir(stubDir);
  // Candidate extraction "succeeds with candidates" so the full step sequence runs.
  await stub(stubDir, "python3", 'echo "[stub] sync_candidates ok"; exit 0');
  // All git ops are no-ops; `git diff --cached --quiet` exiting 0 = nothing staged.
  await stub(stubDir, "git", "exit 0");
  const claudeBin = await stub(stubDir, "claude-stub", 'echo "[stub] claude classification"; exit 0');

  const env = {
    ...process.env,
    PATH: `${stubDir}${path.delimiter}${process.env.PATH}`,
    WEBSITE_DIR: REPO_ROOT,
    CLAUDE_BIN: claudeBin,
    CONCEPTS_PIPELINE_HOME: path.join(dir, "pipeline-home"),
    CONCEPTS_HEARTBEAT_PATH: path.join(dir, "heartbeat.json"),
    CONCEPTS_EXPLORERS_PATH: path.join(dir, "explorers.json"),
    CONCEPTS_RIDER: "1",
    KNOWLEDGE_SYNC_PUSH: "0",
  };
  return { dir, env, fakeDate };
}

async function runSync(env, fakeDate) {
  // execFile rejects on non-zero exit; catch so tests can assert on the code.
  try {
    const { stdout } = await run("bash", [SYNC_SCRIPT, "--date", fakeDate], { env });
    return { code: 0, stdout };
  } catch (err) {
    return { code: err.code, stdout: err.stdout ?? "" };
  }
}

test("forced rider failure: sync completes all steps and exits 0, heartbeat records the failure", async (t) => {
  const { dir, env, fakeDate } = await syncSandbox(t);
  // Malformed explorers file forces the enabled rider to fail.
  await writeFile(path.join(dir, "explorers.json"), "{ not json", "utf8");

  const { code, stdout } = await runSync(env, fakeDate);

  assert.equal(code, 0, `sync must not be aborted by a rider failure\n${stdout}`);
  // The steps AFTER the failure point all ran: classification + commit check + report.
  assert.match(stdout, /\[stub\] claude classification/);
  assert.match(stdout, /no explorer changes to commit/);
  assert.match(stdout, /\[knowledge-sync\] report:/);
  // The failure is visible in the sync summary.
  assert.match(stdout, /concepts rider FAILED \(exit 1\)/);
  const hb = await readHeartbeat(env.CONCEPTS_HEARTBEAT_PATH);
  assert.deepEqual(hb.flags, { riderEnabled: true, riderOk: false });
  assert.ok(hb.steps["knowledge-sync-rider"], "failure still stamps the rider step");
});

test("flag disabled: sync run still records the disabled state in the heartbeat", async (t) => {
  const { env, fakeDate } = await syncSandbox(t);
  delete env.CONCEPTS_RIDER;

  const { code, stdout } = await runSync(env, fakeDate);

  assert.equal(code, 0, stdout);
  assert.match(stdout, /concepts rider done/);
  const hb = await readHeartbeat(env.CONCEPTS_HEARTBEAT_PATH);
  assert.deepEqual(hb.flags, { riderEnabled: false });
  assert.ok(hb.steps["knowledge-sync-rider"], "disabled run still stamps the rider step");
});

test("no-candidates early exit still runs the rider via the EXIT trap", async (t) => {
  const { dir, env, fakeDate } = await syncSandbox(t);
  // Exit 3 = "nothing to consider": the script exits 0 early, before the
  // classification/commit steps — the trap must still fire the rider.
  await stub(path.join(dir, "bin"), "python3", "exit 3");
  delete env.CONCEPTS_RIDER;

  const { code, stdout } = await runSync(env, fakeDate);

  assert.equal(code, 0, stdout);
  assert.match(stdout, /no research candidates/);
  assert.match(stdout, /concepts rider done/);
  const hb = await readHeartbeat(env.CONCEPTS_HEARTBEAT_PATH);
  assert.deepEqual(hb.flags, { riderEnabled: false });
});
