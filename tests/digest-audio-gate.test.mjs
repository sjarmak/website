import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import { access, mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { test } from "node:test";
import { setTimeout as delay } from "node:timers/promises";

import { readEntryAudio } from "../scripts/digest/entry-audio.mjs";
import { startFakeMediaServer } from "./helpers/fake-media-server.mjs";
import { git, makeDigestSandbox, runNode, sandboxEnv } from "./helpers/digest-sandbox.mjs";

const SLUG = "daily-2026-10-16";
const KEY = `digests/${SLUG}.mp3`;
const ENTRY_REL = path.join("src", "content", "digest", `${SLUG}.md`);
const PENDING_REL = path.join(".digest-runs", "pending-audio", `${SLUG}.json`);

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
  const sandbox = await makeDigestSandbox(t, { prefix: "digest-audio-" });
  const audio = randomBytes(48 * 1024);
  const rendered = path.join(sandbox.root, "rendered.mp3");
  await writeFile(rendered, audio);
  const mediaRoot = path.join(sandbox.root, "media", "public", "media");
  const env = sandboxEnv(sandbox, fake, {
    MEDIA_BACKEND: backend,
    ...(backend === "git" ? { WEBSITE_MEDIA_ROOT: mediaRoot } : {}),
    ...extraEnv,
  });
  const specPath = path.join(sandbox.root, "spec.json");
  await writeFile(
    specPath,
    JSON.stringify({
      slug: SLUG,
      title: "Audio gate test issue",
      cadence: "daily",
      date: "2026-10-16",
      summary: "Audio gate test.",
      topics: ["evals"],
      audioFile: rendered,
      durationSec: 61,
      body: "Body.",
    }),
  );
  const publish = () => runNode("scripts/digest/publish-digest.mjs", ["--spec", specPath], { cwd: sandbox.repo, env });
  const gate = (...args) => runNode("scripts/digest/audio-gate.mjs", args, { cwd: sandbox.repo, env }).done;
  const entry = async () => readFile(path.join(sandbox.repo, ENTRY_REL), "utf8");
  const pending = async () => JSON.parse(await readFile(path.join(sandbox.repo, PENDING_REL), "utf8"));
  const hasPending = () => exists(path.join(sandbox.repo, PENDING_REL));
  return { fake, sandbox, audio, env, mediaRoot, publish, gate, entry, pending, hasPending };
}

const lastJson = (stdout) => JSON.parse(stdout.trim().split("\n").at(-1));

test("r2: audio is uploaded and verified before the entry carries audioUrl", async (t) => {
  const ctx = await setup(t);
  const result = await ctx.publish().done;
  assert.equal(result.status, 0, result.stderr);
  assert.equal(lastJson(result.stdout).audio.status, "verified");
  assert.deepEqual(readEntryAudio(await ctx.entry()), { audioUrl: `/media/${KEY}`, durationSec: 61 });
  assert.deepEqual(ctx.fake.objects.get(KEY).body, ctx.audio);
  assert.equal(await ctx.hasPending(), false);
  const firstPublicRequest = ctx.fake.stats.publicRequests[0];
  assert.equal(firstPublicRequest.method, "HEAD");
  assert.equal(await exists(path.join(ctx.sandbox.spool, KEY)), true);
});

test("r2: a failed verification publishes the text without audio and records the pending audio", async (t) => {
  const ctx = await setup(t, { extraEnv: { MEDIA_VERIFY_TIMEOUT_SEC: "1" } });
  ctx.fake.faults.public.set(KEY, { status: 404 });
  const result = await ctx.publish().done;
  assert.equal(result.status, 0, result.stderr);
  const report = lastJson(result.stdout).audio;
  assert.equal(report.status, "pending");
  assert.equal(report.check, "status");
  assert.match(report.retry, /MEDIA_BACKEND=r2 DIGEST_PUSH=1 .*scripts\/digest\/run\.sh attach-pending$/);
  const md = await ctx.entry();
  assert.deepEqual(readEntryAudio(md), {});
  assert.match(md, /^title: Audio gate test issue$/m);
  const record = await ctx.pending();
  assert.equal(record.slug, SLUG);
  assert.equal(record.audioUrl, `/media/${KEY}`);
  assert.equal(record.durationSec, 61);
  assert.equal(record.bytes, ctx.audio.length);
  assert.match(record.sha256, /^[a-f0-9]{64}$/);
  assert.equal(record.check, "status");
});

test("r2: an upload failure never probes the public URL and leaves audio pending", async (t) => {
  const ctx = await setup(t);
  ctx.fake.faults.interruptPuts = 10;
  const result = await ctx.publish().done;
  assert.equal(result.status, 0, result.stderr);
  assert.equal(lastJson(result.stdout).audio.status, "pending");
  assert.equal((await ctx.pending()).check, "upload");
  assert.equal(ctx.fake.stats.publicRequests.length, 0);
  assert.deepEqual(readEntryAudio(await ctx.entry()), {});
});

test("r2: missing credentials fail before anything is written", async (t) => {
  const ctx = await setup(t, { extraEnv: { R2_SECRET_ACCESS_KEY: "" } });
  const result = await ctx.publish().done;
  assert.equal(result.status, 1);
  assert.match(result.stderr, /R2 credentials missing: R2_SECRET_ACCESS_KEY/);
  assert.equal(await exists(path.join(ctx.sandbox.repo, ENTRY_REL)), false);
  assert.equal(await ctx.hasPending(), false);
  assert.equal(ctx.fake.stats.putAttempts, 0);
});

test("r2: a crash between upload and entry write is repaired by rerunning without a second upload", async (t) => {
  const ctx = await setup(t);
  let release;
  ctx.fake.faults.public.set(KEY, { hold: new Promise((resolve) => (release = resolve)) });
  const first = ctx.publish();
  while (ctx.fake.stats.publicRequests.length === 0) await delay(10);
  first.child.kill("SIGKILL");
  const killed = await first.done;
  assert.equal(killed.signal, "SIGKILL");
  assert.equal(ctx.fake.stats.puts, 1);
  assert.equal(await exists(path.join(ctx.sandbox.repo, ENTRY_REL)), false);
  ctx.fake.faults.public.delete(KEY);
  release();

  const rerun = await ctx.publish().done;
  assert.equal(rerun.status, 0, rerun.stderr);
  assert.equal(lastJson(rerun.stdout).audio.status, "verified");
  assert.equal(ctx.fake.stats.puts, 1);
  assert.equal(readEntryAudio(await ctx.entry()).audioUrl, `/media/${KEY}`);
});

test("git: publish copies audio into the media worktree but defers audioUrl until the deploy verifies", async (t) => {
  const ctx = await setup(t, { backend: "git" });
  const result = await ctx.publish().done;
  assert.equal(result.status, 0, result.stderr);
  const report = lastJson(result.stdout).audio;
  assert.equal(report.status, "pending");
  assert.match(report.retry, /^MEDIA_BACKEND=git WEBSITE_MEDIA_DIR=\S+\/media DIGEST_PUSH=1 /);
  assert.deepEqual(await readFile(path.join(ctx.mediaRoot, KEY)), ctx.audio);
  assert.deepEqual(readEntryAudio(await ctx.entry()), {});
  assert.equal((await ctx.pending()).reason, "awaiting media push and deploy");
  assert.equal(ctx.fake.stats.publicRequests.length, 0);
  assert.equal(ctx.fake.stats.putAttempts, 0);
});

test("drain attaches pending audio once it is live, and settle clears it after commit", async (t) => {
  const ctx = await setup(t, { extraEnv: { MEDIA_VERIFY_TIMEOUT_SEC: "1" } });
  ctx.fake.faults.public.set(KEY, { status: 404 });
  assert.equal((await ctx.publish().done).status, 0);
  git(ctx.sandbox.repo, "commit", "-q", "-m", "text only");

  const stillDown = await ctx.gate("drain");
  assert.equal(stillDown.status, 1);
  assert.match(stillDown.stderr, /still pending \(status:/);
  assert.deepEqual(readEntryAudio(await ctx.entry()), {});

  ctx.fake.faults.public.delete(KEY);
  const drained = await ctx.gate("drain");
  assert.equal(drained.status, 0, drained.stderr);
  assert.deepEqual(readEntryAudio(await ctx.entry()), { audioUrl: `/media/${KEY}`, durationSec: 61 });
  assert.equal(git(ctx.sandbox.repo, "diff", "--cached", "--name-only"), ENTRY_REL);
  assert.equal(ctx.fake.stats.puts, 1);

  assert.equal((await ctx.gate("status")).status, 1, "record stays until the attach is committed");
  git(ctx.sandbox.repo, "commit", "-q", "-m", "attach");
  assert.equal((await ctx.gate("settle")).status, 0);
  assert.equal(await ctx.hasPending(), false);
  assert.equal((await ctx.gate("status")).status, 0);
});

test("verify-staged strips audioUrls that do not serve and reports how to retry", async (t) => {
  const ctx = await setup(t, { extraEnv: { MEDIA_VERIFY_TIMEOUT_SEC: "1" } });
  const digestDir = path.join(ctx.sandbox.repo, "src", "content", "digest");
  const write = (slug, audioUrl) =>
    writeFile(
      path.join(digestDir, `${slug}.md`),
      `---\ntitle: ${slug}\ndate: 2026-10-16\naudioUrl: ${audioUrl}\ndurationSec: 30\nitems: []\n---\n\nBody.\n`,
    );
  await mkdir(path.join(ctx.sandbox.spool, "digests"), { recursive: true });
  await writeFile(path.join(ctx.sandbox.spool, "digests", "weekly-2026-10-16.mp3"), ctx.audio);
  await write("weekly-2026-10-16", "/media/digests/weekly-2026-10-16.mp3");
  await write("daily-general-2026-10-16", "https://elsewhere.example/a.mp3");
  ctx.fake.faults.public.set("digests/weekly-2026-10-16.mp3", { contentType: "text/html" });
  git(ctx.sandbox.repo, "add", "src/content/digest");

  const result = await ctx.gate("verify-staged");
  assert.equal(result.status, 1);
  assert.match(result.stderr, /weekly-2026-10-16: removed unverified audioUrl .*content-type/);
  assert.match(result.stderr, /daily-general-2026-10-16: removed unverified audioUrl .*not a \/media\/ URL/);
  for (const slug of ["weekly-2026-10-16", "daily-general-2026-10-16"]) {
    const staged = git(ctx.sandbox.repo, "show", `:src/content/digest/${slug}.md`);
    assert.doesNotMatch(staged, /audioUrl|durationSec/, slug);
  }
  const pendingDir = path.join(ctx.sandbox.repo, ".digest-runs", "pending-audio");
  assert.equal(await exists(path.join(pendingDir, "weekly-2026-10-16.json")), true);
  assert.equal(await exists(path.join(pendingDir, "daily-general-2026-10-16.json")), false);

  const status = await ctx.gate("status");
  assert.equal(status.status, 1);
  assert.match(status.stderr, /PENDING weekly-2026-10-16/);
  assert.match(status.stderr, /url: {4}http:\/\/127\.0\.0\.1:\d+\/media\/digests\/weekly-2026-10-16\.mp3/);
  assert.match(status.stderr, /check: {2}content-type/);
  assert.match(status.stderr, /retry: {2}MEDIA_BACKEND=r2 DIGEST_PUSH=1 .*run\.sh attach-pending/);
});

test("verify-staged leaves entries alone when their audioUrl is already committed", async (t) => {
  const ctx = await setup(t);
  assert.equal((await ctx.publish().done).status, 0);
  git(ctx.sandbox.repo, "commit", "-q", "-m", "published");
  const file = path.join(ctx.sandbox.repo, ENTRY_REL);
  await writeFile(file, (await ctx.entry()).replace("Body.", "Body, edited."));
  git(ctx.sandbox.repo, "add", ENTRY_REL);
  const before = ctx.fake.stats.publicRequests.length;
  const result = await ctx.gate("verify-staged");
  assert.equal(result.status, 0, result.stderr);
  assert.equal(ctx.fake.stats.publicRequests.length, before);
});
