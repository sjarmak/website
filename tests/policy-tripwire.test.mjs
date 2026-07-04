// R19b quarterly policy tripwire (scripts/checks/policy-tripwire-reminder.mjs):
// dry-run prints the bd argv (counts + policy-check text only — no URLs, no
// content), the state file enforces the one-bead-per-quarter rate limit, and
// real mode only writes state after a successful `bd create` (stubbed via
// BD_BIN — tests never create real beads).
import { test } from "node:test";
import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { chmod, mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { promisify } from "node:util";
import os from "node:os";
import path from "node:path";
import { REPO_ROOT } from "../scripts/concepts/lib/pipeline-home.mjs";

const run = promisify(execFile);
const TRIPWIRE = path.join(REPO_ROOT, "scripts", "checks", "policy-tripwire-reminder.mjs");

async function sandbox(t) {
  const dir = await mkdtemp(path.join(os.tmpdir(), "policy-tripwire-"));
  t.after(() => rm(dir, { recursive: true, force: true }));
  const home = path.join(dir, "home");
  const digestDir = path.join(dir, "digest");
  await mkdir(home, { recursive: true });
  await mkdir(digestDir, { recursive: true });
  await writeFile(path.join(digestDir, "daily-2026-07-01.md"), "---\n---\n");
  await writeFile(path.join(digestDir, "daily-2026-07-02.md"), "---\n---\n");
  await writeFile(path.join(digestDir, "notes.txt"), "not an issue\n");
  const statePath = path.join(home, "state", "policy-tripwire-state.json");
  return { dir, home, digestDir, statePath };
}

async function runTripwire(args, env) {
  try {
    const { stdout, stderr } = await run("node", [TRIPWIRE, ...args], {
      env: { ...process.env, ...env },
    });
    return { code: 0, stdout, stderr };
  } catch (err) {
    return { code: err.code, stdout: err.stdout ?? "", stderr: err.stderr ?? "" };
  }
}

test("dry-run files a bd argv with counts + policy-check text only, and writes state", async (t) => {
  const { home, digestDir, statePath } = await sandbox(t);
  const { code, stdout } = await runTripwire(
    ["--dry-run", "--now", "2026-07-04", "--digest-dir", digestDir],
    { CONCEPTS_PIPELINE_HOME: home },
  );
  assert.equal(code, 0, stdout);

  const argvLine = stdout.split("\n").find((l) => l.includes("dry-run: would file"));
  assert.ok(argvLine, `expected a dry-run argv line in:\n${stdout}`);
  const argv = JSON.parse(argvLine.slice(argvLine.indexOf('["')));
  assert.equal(argv[0], "bd");
  assert.equal(argv[1], "create");
  assert.match(argv[2], /^R19 policy tripwire \(2026-Q3\)/);
  const dIndex = argv.indexOf("-d");
  assert.ok(dIndex > 0, "bd argv must carry a -d description");
  const description = argv[dIndex + 1];
  assert.match(description, /scaled-content/);
  assert.match(description, /2 committed issues/, "count = .md issues only");
  assert.match(description, /DIGEST_NOINDEX_LEVER/, "must name the reversal lever");
  assert.match(description, /src\/lib\/register\.ts/, "must point at the lever file");
  assert.ok(!/https?:\/\//.test(description), "counts/policy text only — no URLs");

  const state = JSON.parse(await readFile(statePath, "utf8"));
  assert.equal(state.lastFiledQuarter, "2026-Q3");
});

test("quarterly rate limit: second run in the same quarter is a no-op", async (t) => {
  const { home, digestDir, statePath } = await sandbox(t);
  const env = { CONCEPTS_PIPELINE_HOME: home };
  const args = ["--dry-run", "--digest-dir", digestDir];

  const first = await runTripwire([...args, "--now", "2026-07-04"], env);
  assert.equal(first.code, 0);
  assert.match(first.stdout, /would file/);
  const stateAfterFirst = await readFile(statePath, "utf8");

  // Same quarter, even months later: no-op, state untouched.
  const second = await runTripwire([...args, "--now", "2026-09-30"], env);
  assert.equal(second.code, 0);
  assert.match(second.stdout, /already filed for 2026-Q3 — skipping/);
  assert.ok(!second.stdout.includes("would file"), "same quarter must not file twice");
  assert.equal(await readFile(statePath, "utf8"), stateAfterFirst, "state untouched on skip");

  // A new quarter files again.
  const third = await runTripwire([...args, "--now", "2026-10-01"], env);
  assert.equal(third.code, 0);
  assert.match(third.stdout, /would file/);
  assert.equal(JSON.parse(await readFile(statePath, "utf8")).lastFiledQuarter, "2026-Q4");
});

test("real mode invokes BD_BIN and writes state only on success", async (t) => {
  const { dir, home, digestDir, statePath } = await sandbox(t);
  const calls = path.join(dir, "bd-calls.log");
  const bdStub = path.join(dir, "bd-stub");
  await writeFile(bdStub, `#!/bin/sh\nprintf '%s\\n' "$*" >> ${calls}\necho "created sjai-test"\n`);
  await chmod(bdStub, 0o755);

  const { code, stdout } = await runTripwire(["--now", "2026-07-04", "--digest-dir", digestDir], {
    CONCEPTS_PIPELINE_HOME: home,
    BD_BIN: bdStub,
  });
  assert.equal(code, 0, stdout);
  assert.match(stdout, /filed tripwire bead for 2026-Q3: created sjai-test/);
  assert.match(await readFile(calls, "utf8"), /^create R19 policy tripwire \(2026-Q3\)/);
  assert.equal(JSON.parse(await readFile(statePath, "utf8")).lastFiledQuarter, "2026-Q3");
});

test("failed bd create: non-zero exit, no state write, next run retries", async (t) => {
  const { dir, home, digestDir, statePath } = await sandbox(t);
  const bdFail = path.join(dir, "bd-fail");
  await writeFile(bdFail, "#!/bin/sh\necho 'bd: dolt unreachable' >&2\nexit 1\n");
  await chmod(bdFail, 0o755);
  const env = { CONCEPTS_PIPELINE_HOME: home, BD_BIN: bdFail };

  const { code } = await runTripwire(["--now", "2026-07-04", "--digest-dir", digestDir], env);
  assert.notEqual(code, 0, "a failed filing must be visible to the caller");
  await assert.rejects(readFile(statePath, "utf8"), /ENOENT/, "no state on failure — retry next run");

  const retry = await runTripwire(
    ["--dry-run", "--now", "2026-07-05", "--digest-dir", digestDir],
    env,
  );
  assert.equal(retry.code, 0);
  assert.match(retry.stdout, /would file/);
});
