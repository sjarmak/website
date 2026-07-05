// R14 monthly reminder (scripts/audit/audit-reminder.mjs): dry-run prints the
// bd argv (counts/dates only — never report content), the state file enforces
// the one-bead-per-month rate limit, and real mode only writes state after a
// successful `bd create` (stubbed via BD_BIN — tests never create real beads).
import { test } from "node:test";
import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { chmod, mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { promisify } from "node:util";
import os from "node:os";
import path from "node:path";
import { REPO_ROOT } from "../scripts/concepts/lib/pipeline-home.mjs";

const run = promisify(execFile);
const REMINDER = path.join(REPO_ROOT, "scripts", "audit", "audit-reminder.mjs");

async function sandbox(t) {
  const dir = await mkdtemp(path.join(os.tmpdir(), "audit-reminder-"));
  t.after(() => rm(dir, { recursive: true, force: true }));
  const home = path.join(dir, "home");
  const auditsDir = path.join(home, "audits");
  await mkdir(auditsDir, { recursive: true });
  const statePath = path.join(auditsDir, "reminder-state.json");
  return { dir, home, auditsDir, statePath };
}

async function runReminder(args, env) {
  try {
    const { stdout, stderr } = await run("node", [REMINDER, ...args], {
      env: { ...process.env, ...env },
    });
    return { code: 0, stdout, stderr };
  } catch (err) {
    return { code: err.code, stdout: err.stdout ?? "", stderr: err.stderr ?? "" };
  }
}

test("dry-run files a bd argv with counts and dates only, and writes state", async (t) => {
  const { home, auditsDir, statePath } = await sandbox(t);
  await writeFile(path.join(auditsDir, "audit-2026-05-01.json"), "{}\n");
  await writeFile(path.join(auditsDir, "audit-2026-06-10.json"), "{}\n");
  await writeFile(path.join(auditsDir, "audit-2026-06-10-123456.json"), "{}\n");
  // Non-report noise must not count.
  await writeFile(path.join(auditsDir, "audit-2026-06-10.md"), "# md\n");

  const { code, stdout } = await runReminder(["--dry-run", "--now", "2026-07-04"], {
    CONCEPTS_PIPELINE_HOME: home,
  });
  assert.equal(code, 0, stdout);

  const argvLine = stdout.split("\n").find((l) => l.includes("dry-run: would file"));
  assert.ok(argvLine, `expected a dry-run argv line in:\n${stdout}`);
  const argv = JSON.parse(argvLine.slice(argvLine.indexOf('["')));
  assert.equal(argv[0], "bd");
  assert.equal(argv[1], "create");
  assert.match(argv[2], /^R14 audit due \(2026-07\)/);
  const dIndex = argv.indexOf("-d");
  assert.ok(dIndex > 0, "bd argv must carry a -d description");
  const description = argv[dIndex + 1];
  assert.match(description, /Audit reports on file: 3\./, "count = JSON reports only");
  assert.match(description, /Last audit: 2026-06-10\./);
  assert.match(description, /llm-bio-audit\.mjs/);
  assert.ok(!/https?:\/\//.test(description), "description must reference counts/dates only, no URLs/content");

  const state = JSON.parse(await readFile(statePath, "utf8"));
  assert.equal(state.lastFiledMonth, "2026-07");
});

test("monthly rate limit: second run in the same month is a no-op", async (t) => {
  const { home, statePath } = await sandbox(t);
  const env = { CONCEPTS_PIPELINE_HOME: home };

  const first = await runReminder(["--dry-run", "--now", "2026-07-01"], env);
  assert.equal(first.code, 0);
  assert.match(first.stdout, /would file/);
  const stateAfterFirst = await readFile(statePath, "utf8");

  const second = await runReminder(["--dry-run", "--now", "2026-07-31"], env);
  assert.equal(second.code, 0);
  assert.match(second.stdout, /already filed for 2026-07 — skipping/);
  assert.ok(!second.stdout.includes("would file"), "same month must not file twice");
  assert.equal(await readFile(statePath, "utf8"), stateAfterFirst, "state untouched on skip");

  // A new month files again.
  const third = await runReminder(["--dry-run", "--now", "2026-08-01"], env);
  assert.equal(third.code, 0);
  assert.match(third.stdout, /would file/);
  assert.equal(JSON.parse(await readFile(statePath, "utf8")).lastFiledMonth, "2026-08");
});

test("real mode invokes BD_BIN and writes state only on success", async (t) => {
  const { dir, home, statePath } = await sandbox(t);
  const binDir = path.join(dir, "bin");
  await mkdir(binDir);
  const calls = path.join(dir, "bd-calls.log");
  const bdStub = path.join(binDir, "bd-stub");
  await writeFile(bdStub, `#!/bin/sh\nprintf '%s\\n' "$*" >> ${calls}\necho "created sjai-test"\n`);
  await chmod(bdStub, 0o755);
  const env = { CONCEPTS_PIPELINE_HOME: home, BD_BIN: bdStub };

  const { code, stdout } = await runReminder(["--now", "2026-07-04"], env);
  assert.equal(code, 0, stdout);
  assert.match(stdout, /filed reminder bead for 2026-07: created sjai-test/);
  const logged = await readFile(calls, "utf8");
  assert.match(logged, /^create R14 audit due \(2026-07\)/);
  assert.equal(JSON.parse(await readFile(statePath, "utf8")).lastFiledMonth, "2026-07");
});

test("failed bd create: non-zero exit, no state write, next run retries", async (t) => {
  const { dir, home, statePath } = await sandbox(t);
  const binDir = path.join(dir, "bin");
  await mkdir(binDir);
  const bdFail = path.join(binDir, "bd-fail");
  await writeFile(bdFail, "#!/bin/sh\necho 'bd: dolt unreachable' >&2\nexit 1\n");
  await chmod(bdFail, 0o755);
  const env = { CONCEPTS_PIPELINE_HOME: home, BD_BIN: bdFail };

  const { code } = await runReminder(["--now", "2026-07-04"], env);
  assert.notEqual(code, 0, "a failed filing must be visible to the caller");
  await assert.rejects(readFile(statePath, "utf8"), /ENOENT/, "no state on failure — retry next run");

  // Retry (same month) still attempts, because no state was recorded.
  const retry = await runReminder(["--dry-run", "--now", "2026-07-05"], env);
  assert.equal(retry.code, 0);
  assert.match(retry.stdout, /would file/);
});
