import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { access, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { test } from "node:test";
import { setTimeout as delay } from "node:timers/promises";

import { readEntryAudio } from "../scripts/digest/entry-audio.mjs";
import { git, makeDigestSandbox, REPO_ROOT, runProcess, sandboxEnv, TEST_ACCOUNT_ID } from "./helpers/digest-sandbox.mjs";
import { HAS_FFMPEG, fakeKokoroVenv } from "./helpers/fake-kokoro.mjs";
import { startFakeMediaServer } from "./helpers/fake-media-server.mjs";

const STUB_CLAUDE = path.join(REPO_ROOT, "tests", "helpers", "stub-claude.mjs");
const DATE = "2026-10-16";
const SLUG = `daily-${DATE}`;
const KEY = `digests/${SLUG}.mp3`;
const ENTRY_REL = `src/content/digest/${SLUG}.md`;
const PENDING_REL = path.join(".digest-runs", "pending-audio", `${SLUG}.json`);
const needsFfmpeg = { skip: !HAS_FFMPEG && "ffmpeg is not installed" };

async function exists(file) {
  try {
    await access(file);
    return true;
  } catch {
    return false;
  }
}

async function setup(t, { backend = "r2", extraEnv = {} } = {}) {
  const fake = await startFakeMediaServer();
  t.after(() => fake.close());
  const sandbox = await makeDigestSandbox(t, { prefix: "digest-run-", withScripts: true });
  const runSh = path.join(sandbox.repo, "scripts", "digest", "run.sh");
  const r2EnvFile = path.join(sandbox.root, "r2.env");
  await writeFile(
    r2EnvFile,
    [
      `R2_ACCOUNT_ID=${TEST_ACCOUNT_ID}`,
      "R2_ACCESS_KEY_ID=test-access",
      "R2_SECRET_ACCESS_KEY=test-secret",
      `R2_BUCKET=${fake.bucket}`,
      `R2_ENDPOINT_OVERRIDE=${fake.endpoint}`,
      "",
    ].join("\n"),
    { mode: 0o600 },
  );
  const stubLog = path.join(sandbox.root, "stub.log");
  const env = sandboxEnv(sandbox, fake, {
    MEDIA_BACKEND: backend,
    WEBSITE_DIR: sandbox.repo,
    R2_ENV_FILE: r2EnvFile,
    CLAUDE_BIN: STUB_CLAUDE,
    KOKORO_VENV: await fakeKokoroVenv(sandbox.root),
    DIGEST_DATE: DATE,
    DIGEST_PUSH: "0",
    STUB_LOG: stubLog,
    ...extraEnv,
  });
  for (const name of ["R2_ACCOUNT_ID", "R2_ACCESS_KEY_ID", "R2_SECRET_ACCESS_KEY", "R2_BUCKET", "R2_ENDPOINT_OVERRIDE"]) {
    delete env[name];
  }
  const run = (args, overrides = {}) =>
    runProcess("bash", [runSh, ...args], { cwd: sandbox.root, env: { ...env, ...overrides } });
  const committedEntry = (ref = "HEAD") => git(sandbox.repo, "show", `${ref}:${ENTRY_REL}`);
  const stubEvents = async () =>
    (await readFile(stubLog, "utf8")).trim().split("\n").map((line) => JSON.parse(line));
  return { fake, sandbox, env, run, committedEntry, stubEvents };
}

test("run.sh rejects an unknown media backend before doing any work", async (t) => {
  const ctx = await setup(t, { extraEnv: { MEDIA_BACKEND: "s3" } });
  const result = await ctx.run(["daily"]).done;
  assert.equal(result.status, 2);
  assert.match(result.stderr, /MEDIA_BACKEND must be git or r2, found: s3/);
});

test("run.sh defaults the git media worktree to ~/website-worktrees/media", async (t) => {
  const ctx = await setup(t, { backend: "git" });
  const result = await ctx.run(["daily"], { HOME: ctx.sandbox.root }).done;
  assert.equal(result.status, 2);
  const expected = path.join(ctx.sandbox.root, "website-worktrees", "media");
  assert.ok(result.stderr.includes(`Media worktree not found at ${expected}`), result.stderr);
});

test("run.sh rejects a media wait that is not a positive whole number of seconds", async (t) => {
  const ctx = await setup(t);
  for (const [name, value] of [["MEDIA_START_DRAIN_SEC", "0"], ["MEDIA_DEPLOY_WAIT_SEC", "10m"], ["MEDIA_VERIFY_TIMEOUT_SEC", "1.5"]]) {
    const result = await ctx.run(["daily"], { STUB_SLUG: SLUG, [name]: value }).done;
    assert.equal(result.status, 2, name);
    assert.ok(result.stderr.includes(`${name} must be a positive whole number of seconds, found: ${value}`), result.stderr);
  }
  assert.equal(await exists(ctx.env.STUB_LOG), false);
});

test("run.sh in r2 mode fails fast when the credentials file is missing a variable", async (t) => {
  const ctx = await setup(t);
  await writeFile(ctx.env.R2_ENV_FILE, `R2_ACCOUNT_ID=${TEST_ACCOUNT_ID}\nR2_BUCKET=test-bucket\n`);
  const result = await ctx.run(["daily"], { STUB_SLUG: SLUG }).done;
  assert.equal(result.status, 2);
  assert.match(result.stdout, /R2 credentials missing: R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY/);
  assert.doesNotMatch(result.stdout + result.stderr, new RegExp(TEST_ACCOUNT_ID));
  assert.equal(await exists(ctx.env.STUB_LOG), false);
});

test("two concurrent runs take turns on the run lock", async (t) => {
  const ctx = await setup(t, { extraEnv: { STUB_SLEEP_MS: "1500" } });
  const [first, second] = await Promise.all([ctx.run(["daily"]).done, ctx.run(["daily"]).done]);
  assert.equal(first.status, 0, first.stderr);
  assert.equal(second.status, 0, second.stderr);
  const events = await ctx.stubEvents();
  assert.deepEqual(events.map((e) => e.event), ["start", "end", "start", "end"]);
  assert.equal(events[0].pid, events[1].pid);
  assert.equal(events[2].pid, events[3].pid);
  assert.ok(events[2].at >= events[1].at);
});

test("a run that cannot get the lock in time exits 75 and names the lock", async (t) => {
  const ctx = await setup(t, { extraEnv: { DIGEST_LOCK_WAIT_SEC: "1" } });
  const lockFile = path.join(ctx.sandbox.repo, ".digest-runs", "run.lock");
  await ctx.run(["attach-pending"]).done;
  const holder = spawn("flock", [lockFile, "sleep", "30"], { stdio: "ignore" });
  t.after(() => holder.kill("SIGKILL"));
  for (;;) {
    const probe = await runProcess("flock", ["-n", lockFile, "true"], { cwd: ctx.sandbox.root, env: ctx.env }).done;
    if (probe.status !== 0) break;
    await delay(20);
  }
  const result = await ctx.run(["daily"], { STUB_SLUG: SLUG }).done;
  assert.equal(result.status, 75);
  assert.match(result.stderr, /gave up after 1s waiting for .*\.digest-runs\/run\.lock/);
  assert.equal(await exists(ctx.env.STUB_LOG), false);
});

test("r2: a run uploads, verifies, and commits the issue with its player", needsFfmpeg, async (t) => {
  const ctx = await setup(t, { extraEnv: { STUB_SLUG: SLUG } });
  const result = await ctx.run(["daily"]).done;
  assert.equal(result.status, 0, result.stdout + result.stderr);
  assert.equal(git(ctx.sandbox.repo, "log", "-1", "--format=%s"), `content(digest): daily ${DATE}`);
  const audio = readEntryAudio(ctx.committedEntry());
  assert.equal(audio.audioUrl, `/media/${KEY}`);
  assert.ok(audio.durationSec > 0);
  assert.equal(ctx.fake.stats.puts, 1);
  assert.deepEqual(ctx.fake.objects.get(KEY).body, await readFile(path.join(ctx.sandbox.spool, KEY)));
  assert.equal(await exists(path.join(ctx.sandbox.repo, PENDING_REL)), false);
});

test("r2: the credentials file wins over the caller's R2 variables, and the agent sees none of them", needsFfmpeg, async (t) => {
  const ctx = await setup(t, { extraEnv: { STUB_SLUG: SLUG } });
  const result = await ctx.run(["daily"], {
    R2_ACCOUNT_ID: "caller-account",
    R2_ACCESS_KEY_ID: "caller-key",
    R2_SECRET_ACCESS_KEY: "caller-secret",
    R2_BUCKET: "caller-bucket",
  }).done;
  assert.equal(result.status, 0, result.stdout + result.stderr);
  assert.equal(ctx.fake.stats.puts, 1);
  assert.equal(readEntryAudio(ctx.committedEntry()).audioUrl, `/media/${KEY}`);
  const [start] = await ctx.stubEvents();
  assert.deepEqual(start.r2Env, ["R2_ENV_FILE"]);
});

test("r2: the start drain attaches waiting audio before the agent runs", needsFfmpeg, async (t) => {
  const ctx = await setup(t, { extraEnv: { STUB_SLUG: SLUG, MEDIA_VERIFY_TIMEOUT_SEC: "1" } });
  ctx.fake.faults.public.set(KEY, { status: 404 });
  const failed = await ctx.run(["daily"]).done;
  assert.equal(failed.status, 1, failed.stdout + failed.stderr);

  ctx.fake.faults.public.delete(KEY);
  const next = await ctx.run(["daily"], { STUB_SLUG: "" }).done;
  assert.equal(next.status, 0, next.stdout + next.stderr);
  const starts = (await ctx.stubEvents()).filter((event) => event.event === "start");
  assert.deepEqual(starts.map((event) => event.staged), [[], [ENTRY_REL]]);
  assert.equal(readEntryAudio(ctx.committedEntry()).audioUrl, `/media/${KEY}`);
  assert.equal(await exists(path.join(ctx.sandbox.repo, PENDING_REL)), false);
});

test("r2: audio that fails verification ships text-only, exits 1 with a retry command, then attach-pending attaches it", needsFfmpeg, async (t) => {
  const ctx = await setup(t, { extraEnv: { STUB_SLUG: SLUG, MEDIA_VERIFY_TIMEOUT_SEC: "1" } });
  ctx.fake.faults.public.set(KEY, { status: 404 });
  const failed = await ctx.run(["daily"]).done;
  assert.equal(failed.status, 1, failed.stdout + failed.stderr);
  assert.match(failed.stdout, new RegExp(`PENDING ${SLUG}`));
  assert.match(failed.stdout, new RegExp(`url: +${ctx.fake.publicBase}/${KEY}`));
  assert.match(failed.stdout, /check: +status/);
  assert.match(failed.stdout, /retry: +MEDIA_BACKEND=r2 DIGEST_PUSH=1 \S+\/scripts\/digest\/run\.sh attach-pending/);
  assert.equal(git(ctx.sandbox.repo, "log", "-1", "--format=%s"), `content(digest): daily ${DATE}`);
  assert.deepEqual(readEntryAudio(ctx.committedEntry()), {});
  assert.equal(await exists(path.join(ctx.sandbox.repo, PENDING_REL)), true);

  ctx.fake.faults.public.delete(KEY);
  const attached = await ctx.run(["attach-pending"], { STUB_SLUG: "" }).done;
  assert.equal(attached.status, 0, attached.stdout + attached.stderr);
  assert.equal(git(ctx.sandbox.repo, "log", "-1", "--format=%s"), "content(digest): attach verified audio");
  assert.equal(readEntryAudio(ctx.committedEntry()).audioUrl, `/media/${KEY}`);
  assert.equal(await exists(path.join(ctx.sandbox.repo, PENDING_REL)), false);
  assert.equal(ctx.fake.stats.puts, 1);
  const events = await ctx.stubEvents();
  assert.equal(events.length, 2);
});

async function addOriginAndMediaWorktree(ctx) {
  const origin = path.join(ctx.sandbox.root, "origin.git");
  const mediaDir = path.join(ctx.sandbox.root, "website-media");
  git(ctx.sandbox.root, "init", "-q", "--bare", "-b", "main", origin);
  git(ctx.sandbox.repo, "remote", "add", "origin", origin);
  git(ctx.sandbox.repo, "push", "-q", "-u", "origin", "main");
  git(ctx.sandbox.repo, "branch", "media");
  git(ctx.sandbox.repo, "worktree", "add", "-q", mediaDir, "media");
  await writeFile(path.join(mediaDir, ".gitignore"), ".digest-runs/\n/scripts\n");
  git(mediaDir, "commit", "-q", "-am", "media branch tracks public/media");
  git(mediaDir, "push", "-q", "-u", "origin", "media");
  return { origin, mediaDir };
}

test("git: audio waits for the media deploy, ships text-only meanwhile, and attaches once it serves", needsFfmpeg, async (t) => {
  const ctx = await setup(t, {
    backend: "git",
    extraEnv: {
      STUB_SLUG: SLUG,
      DIGEST_PUSH: "1",
      MEDIA_VERIFY_TIMEOUT_SEC: "1",
      MEDIA_START_DRAIN_SEC: "1",
      MEDIA_DEPLOY_WAIT_SEC: "1",
    },
  });
  const { origin, mediaDir } = await addOriginAndMediaWorktree(ctx);
  const run = (args, overrides = {}) => ctx.run(args, { WEBSITE_MEDIA_DIR: mediaDir, ...overrides });

  const first = await run(["daily"]).done;
  assert.equal(first.status, 1, first.stdout + first.stderr);
  assert.match(first.stdout, new RegExp(`PENDING ${SLUG}`));
  assert.match(first.stdout, /retry: +MEDIA_BACKEND=git WEBSITE_MEDIA_DIR=\S+website-media DIGEST_PUSH=1 /);
  const pushedAudio = git(origin, "ls-tree", "--name-only", "media", `public/media/${KEY}`);
  assert.equal(pushedAudio, `public/media/${KEY}`);
  assert.deepEqual(readEntryAudio(git(origin, "show", `main:${ENTRY_REL}`)), {});

  const unpushed = { STUB_SLUG: "", DIGEST_PUSH: "0", MEDIA_DEPLOY_WAIT_SEC: "600" };
  const startedAt = Date.now();
  const notLive = await run(["attach-pending"], unpushed).done;
  assert.equal(notLive.status, 1, notLive.stdout + notLive.stderr);
  assert.ok(Date.now() - startedAt < 60_000, "attach-pending without a push waits only for the start drain");
  assert.match(notLive.stdout, /start drain: audio that did not verify within 1s stays pending/);

  const bytes = await readFile(path.join(mediaDir, "public", "media", KEY));
  ctx.fake.putObject(KEY, bytes);
  const second = await run(["attach-pending"], unpushed).done;
  assert.equal(second.status, 0, second.stdout + second.stderr);
  assert.equal(git(ctx.sandbox.repo, "log", "-1", "--format=%s"), "content(digest): attach verified audio");
  assert.equal(readEntryAudio(ctx.committedEntry()).audioUrl, `/media/${KEY}`);
  assert.deepEqual(readEntryAudio(git(origin, "show", `main:${ENTRY_REL}`)), {});
  assert.equal(await exists(path.join(ctx.sandbox.repo, PENDING_REL)), false);
  assert.equal(ctx.fake.stats.puts, 0);
});
