// R19a red-CI notification (scripts/checks/notify-red-ci.mjs): dry-run asserts
// BOTH channels (NOTIFY_CMD set / unset), real mode delivers via a capture
// stub or a loud marker in the pipeline home, and a broken NOTIFY_CMD still
// preserves the alarm as a marker. Tests never send a real notification —
// NOTIFY_CMD only ever points at local capture stubs.
import { test } from "node:test";
import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { chmod, mkdir, mkdtemp, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { promisify } from "node:util";
import os from "node:os";
import path from "node:path";
import { REPO_ROOT } from "../scripts/concepts/lib/pipeline-home.mjs";

const run = promisify(execFile);
const NOTIFY = path.join(REPO_ROOT, "scripts", "checks", "notify-red-ci.mjs");

async function sandbox(t) {
  const dir = await mkdtemp(path.join(os.tmpdir(), "notify-red-ci-"));
  t.after(() => rm(dir, { recursive: true, force: true }));
  const home = path.join(dir, "home");
  await mkdir(home, { recursive: true });
  return { dir, home, alertsDir: path.join(home, "alerts") };
}

async function runNotify(args, env) {
  // NOTIFY_CMD must be explicitly controlled per test — never inherited.
  const base = { ...process.env };
  delete base.NOTIFY_CMD;
  try {
    const { stdout, stderr } = await run("node", [NOTIFY, ...args], { env: { ...base, ...env } });
    return { code: 0, stdout, stderr };
  } catch (err) {
    return { code: err.code, stdout: err.stdout ?? "", stderr: err.stderr ?? "" };
  }
}

async function alertMarkers(alertsDir) {
  try {
    return (await readdir(alertsDir)).filter((n) => n.startsWith("red-ci-"));
  } catch (err) {
    if (err.code === "ENOENT") return [];
    throw err;
  }
}

test("dry-run with NOTIFY_CMD set: prints the command channel, writes nothing", async (t) => {
  const { home, alertsDir } = await sandbox(t);
  const { code, stdout } = await runNotify(["--dry-run", "--context", "red CI on abc123"], {
    CONCEPTS_PIPELINE_HOME: home,
    NOTIFY_CMD: 'ntfy publish --title "$NOTIFY_TITLE" digest-alarms "$NOTIFY_MESSAGE"',
  });
  assert.equal(code, 0, stdout);
  assert.match(stdout, /dry-run: would run NOTIFY_CMD via sh -c: ntfy publish/);
  assert.match(stdout, /red CI on abc123/);
  assert.deepEqual(await alertMarkers(alertsDir), [], "dry-run must not write a marker");
});

test("dry-run with NOTIFY_CMD unset: prints the marker channel + path, writes nothing", async (t) => {
  const { home, alertsDir } = await sandbox(t);
  const { code, stdout } = await runNotify(["--dry-run", "--context", "red CI on abc123"], {
    CONCEPTS_PIPELINE_HOME: home,
  });
  assert.equal(code, 0, stdout);
  assert.match(stdout, /dry-run: NOTIFY_CMD unset — would write marker /);
  assert.ok(
    stdout.includes(path.join(home, "alerts", "red-ci-")),
    `marker path must live under the pipeline home alerts dir:\n${stdout}`,
  );
  assert.match(stdout, /red CI on abc123/);
  assert.deepEqual(await alertMarkers(alertsDir), [], "dry-run must not write a marker");
});

test("real mode with NOTIFY_CMD: stub receives title/message env + stdin, no marker", async (t) => {
  const { dir, home, alertsDir } = await sandbox(t);
  const capture = path.join(dir, "capture.txt");
  const stub = path.join(dir, "notify-stub");
  await writeFile(
    stub,
    `#!/bin/sh\n{ echo "title=$NOTIFY_TITLE"; echo "message=$NOTIFY_MESSAGE"; echo "stdin=$(cat)"; } > ${capture}\n`,
  );
  await chmod(stub, 0o755);

  const { code, stdout } = await runNotify(
    ["--context", "validate-digest-registers failed", "--title", "custom title"],
    { CONCEPTS_PIPELINE_HOME: home, NOTIFY_CMD: stub },
  );
  assert.equal(code, 0, stdout);
  assert.match(stdout, /notified via NOTIFY_CMD/);
  const captured = await readFile(capture, "utf8");
  assert.match(captured, /^title=custom title$/m);
  assert.match(captured, /^message=validate-digest-registers failed$/m);
  assert.match(captured, /^stdin=validate-digest-registers failed$/m);
  assert.deepEqual(await alertMarkers(alertsDir), [], "delivered via command — no marker");
});

test("real mode without NOTIFY_CMD: loud marker in the pipeline home, banner on stderr", async (t) => {
  const { home, alertsDir } = await sandbox(t);
  const { code, stderr } = await runNotify(["--context", "run.sh daily FAILED (exit 1)"], {
    CONCEPTS_PIPELINE_HOME: home,
  });
  assert.equal(code, 0, stderr);
  const markers = await alertMarkers(alertsDir);
  assert.equal(markers.length, 1, "exactly one marker file");
  const body = await readFile(path.join(alertsDir, markers[0]), "utf8");
  assert.match(body, /digest pipeline RED/);
  assert.match(body, /run\.sh daily FAILED \(exit 1\)/);
  assert.match(stderr, /!{20,}/, "banner must be loud");
  assert.match(stderr, /run\.sh daily FAILED/);
});

test("failing NOTIFY_CMD: marker fallback written EVERY time, nonzero exit", async (t) => {
  const { home, alertsDir } = await sandbox(t);

  // `exit 7` exits without ever reading stdin — the NORMAL shape of a broken
  // notifier (wrong path, permission denied, immediate failure) — so every
  // run races the child's exit against the stdin write and EPIPEs the stream.
  // An unhandled EPIPE crashes the process BEFORE the marker fallback,
  // silently dropping the alarm; that regression was intermittent (~90%
  // repro), so this asserts the marker lands on every one of 12 iterations.
  const ITERATIONS = 12;
  for (let i = 1; i <= ITERATIONS; i++) {
    const { code, stderr } = await runNotify(["--context", `red CI on def456 (run ${i})`], {
      CONCEPTS_PIPELINE_HOME: home,
      NOTIFY_CMD: "exit 7",
    });
    assert.notEqual(code, 0, `run ${i}: broken channel must be visible to the caller`);
    assert.doesNotMatch(stderr, /EPIPE/, `run ${i}: notifier exit must not crash the process`);
    assert.match(stderr, /notification channel is BROKEN/, `run ${i}: loud banner`);

    const markers = await alertMarkers(alertsDir);
    assert.equal(markers.length, i, `run ${i}: the alarm must NEVER be dropped`);
    markers.sort();
    const body = await readFile(path.join(alertsDir, markers.at(-1)), "utf8");
    assert.match(body, new RegExp(`red CI on def456 \\(run ${i}\\)`));
    assert.match(body, /NOTIFY_CMD exited 7/);
  }
});

test("missing --context is a usage error", async (t) => {
  const { home } = await sandbox(t);
  const { code, stderr } = await runNotify([], { CONCEPTS_PIPELINE_HOME: home });
  assert.equal(code, 2);
  assert.match(stderr, /usage: notify-red-ci\.mjs --context/);
});
