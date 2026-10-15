import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import { access, mkdir, readFile, rm, writeFile } from "node:fs/promises";
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
const DROP = /cd \S+ && flock \.digest-runs\/run\.lock node scripts\/digest\/audio-gate\.mjs drop --slug/;

async function exists(file) {
  try {
    await access(file);
    return true;
  } catch {
    return false;
  }
}

const withoutR2 = (env) => Object.fromEntries(Object.entries(env).filter(([name]) => !name.startsWith("R2_")));

async function setup(t, { backend = "r2", extraEnv = {} } = {}) {
  const fake = await startFakeMediaServer();
  t.after(() => fake.close());
  const sandbox = await makeDigestSandbox(t, { prefix: "digest-audio-" });
  const audio = randomBytes(48 * 1024);
  const mediaRoot = path.join(sandbox.root, "media", "public", "media");
  const env = sandboxEnv(sandbox, fake, {
    MEDIA_BACKEND: backend,
    ...(backend === "git" ? { WEBSITE_MEDIA_ROOT: mediaRoot } : {}),
    ...extraEnv,
  });
  const publish = async ({ slug = SLUG, bytes = audio, durationSec = 61, body = "Body." } = {}) => {
    const rendered = path.join(sandbox.root, `${slug}-rendered.mp3`);
    const specPath = path.join(sandbox.root, `${slug}-spec.json`);
    await writeFile(rendered, bytes);
    await writeFile(
      specPath,
      JSON.stringify({
        slug,
        title: "Audio gate test issue",
        cadence: "daily",
        date: slug.slice(-10),
        summary: "Audio gate test.",
        topics: ["evals"],
        audioFile: rendered,
        durationSec,
        body,
      }),
    );
    return runNode("scripts/digest/publish-digest.mjs", ["--spec", specPath], { cwd: sandbox.repo, env: withoutR2(env) })
      .done;
  };
  const gateProcess = (...args) => runNode("scripts/digest/audio-gate.mjs", args, { cwd: sandbox.repo, env });
  const gate = (...args) => gateProcess(...args).done;
  const entry = async () => readFile(path.join(sandbox.repo, ENTRY_REL), "utf8");
  const pendingFile = (slug = SLUG) => path.join(sandbox.repo, ".digest-runs", "pending-audio", `${slug}.json`);
  const pending = async (slug = SLUG) => JSON.parse(await readFile(pendingFile(slug), "utf8"));
  const hasPending = () => exists(pendingFile());
  return { fake, sandbox, audio, env, mediaRoot, publish, gate, gateProcess, entry, pendingFile, pending, hasPending };
}

const lastJson = (stdout) => JSON.parse(stdout.trim().split("\n").at(-1));

test("r2: publish queues audio without credentials or network, then drain uploads, verifies and attaches it", async (t) => {
  const ctx = await setup(t);
  const published = await ctx.publish();
  assert.equal(published.status, 0, published.stderr);
  const output = lastJson(published.stdout);
  assert.equal(output.audioUrl, undefined);
  assert.equal(output.audio.status, "pending");
  assert.equal(output.audio.check, "queued");
  assert.match(output.audio.reason, /uploads it to R2, verifies its public URL, then attaches the player/);
  assert.match(output.audio.retry, /MEDIA_BACKEND=r2 DIGEST_PUSH=1 .*scripts\/digest\/run\.sh attach-pending$/);
  assert.match(published.stderr, /pending until run\.sh verifies it at its public URL/);
  assert.deepEqual(readEntryAudio(await ctx.entry()), {});
  assert.deepEqual(ctx.fake.stats, { puts: 0, putAttempts: 0, heads: 0, publicRequests: [] });
  assert.deepEqual(await readFile(path.join(ctx.sandbox.spool, KEY)), ctx.audio);
  const queued = await ctx.pending();
  assert.equal(queued.check, "queued");
  assert.equal(queued.file, path.join(ctx.sandbox.spool, KEY));
  assert.equal(queued.audioUrl, `/media/${KEY}`);
  assert.equal(queued.durationSec, 61);
  assert.equal(queued.bytes, ctx.audio.length);
  assert.match(queued.sha256, /^[a-f0-9]{64}$/);

  const drained = await ctx.gate("drain");
  assert.equal(drained.status, 0, drained.stderr);
  assert.deepEqual(readEntryAudio(await ctx.entry()), { audioUrl: `/media/${KEY}`, durationSec: 61 });
  assert.deepEqual(ctx.fake.objects.get(KEY).body, ctx.audio);
  assert.equal(ctx.fake.stats.publicRequests[0].method, "HEAD");
  assert.equal((await ctx.pending()).check, "verified");
});

test("r2: drain leaves audio pending, with the failed check, while its public URL does not serve", async (t) => {
  const ctx = await setup(t, { extraEnv: { MEDIA_VERIFY_TIMEOUT_SEC: "1" } });
  assert.equal((await ctx.publish()).status, 0);
  ctx.fake.faults.public.set(KEY, { status: 404 });
  const drained = await ctx.gate("drain");
  assert.equal(drained.status, 1);
  assert.match(drained.stderr, /still pending \(status:/);
  assert.deepEqual(readEntryAudio(await ctx.entry()), {});
  const record = await ctx.pending();
  assert.equal(record.check, "status");
  assert.match(record.reason, /404/);
  assert.ok(Date.parse(record.updatedAt) > 0);
});

test("r2: an upload failure never probes the public URL and leaves audio pending", async (t) => {
  const ctx = await setup(t);
  assert.equal((await ctx.publish()).status, 0);
  ctx.fake.faults.interruptPuts = 10;
  const drained = await ctx.gate("drain");
  assert.equal(drained.status, 1);
  assert.equal((await ctx.pending()).check, "upload");
  assert.equal(ctx.fake.stats.publicRequests.length, 0);
  assert.deepEqual(readEntryAudio(await ctx.entry()), {});
});

test("r2: drain exits 2 naming missing credentials without printing any values, even with nothing pending", async (t) => {
  const ctx = await setup(t, { extraEnv: { R2_SECRET_ACCESS_KEY: "", R2_BUCKET: " " } });
  const empty = await ctx.gate("drain");
  assert.equal(empty.status, 2);
  assert.match(empty.stderr, /R2 credentials missing: R2_SECRET_ACCESS_KEY, R2_BUCKET/);
  assert.doesNotMatch(empty.stderr, /test-access|0123456789abcdef/);

  assert.equal((await ctx.publish()).status, 0);
  const queued = await ctx.gate("drain");
  assert.equal(queued.status, 2);
  assert.equal(ctx.fake.stats.putAttempts, 0);
  assert.equal((await ctx.pending()).check, "queued");
});

test("r2: a drain killed mid-verification is repaired by rerunning without a second upload", async (t) => {
  const ctx = await setup(t);
  assert.equal((await ctx.publish()).status, 0);
  let release;
  ctx.fake.faults.public.set(KEY, { hold: new Promise((resolve) => (release = resolve)) });
  const first = ctx.gateProcess("drain");
  while (ctx.fake.stats.publicRequests.length === 0) await delay(10);
  first.child.kill("SIGKILL");
  assert.equal((await first.done).signal, "SIGKILL");
  assert.equal(ctx.fake.stats.puts, 1);
  assert.deepEqual(readEntryAudio(await ctx.entry()), {});
  ctx.fake.faults.public.delete(KEY);
  release();

  const rerun = await ctx.gate("drain");
  assert.equal(rerun.status, 0, rerun.stderr);
  assert.equal(ctx.fake.stats.puts, 1);
  assert.equal(readEntryAudio(await ctx.entry()).audioUrl, `/media/${KEY}`);
});

test("git: publish copies audio into the media worktree and queues it without touching the network", async (t) => {
  const ctx = await setup(t, { backend: "git" });
  const result = await ctx.publish();
  assert.equal(result.status, 0, result.stderr);
  const report = lastJson(result.stdout).audio;
  assert.equal(report.status, "pending");
  assert.equal(report.check, "queued");
  assert.match(report.retry, /^MEDIA_BACKEND=git WEBSITE_MEDIA_DIR=\S+\/media DIGEST_PUSH=1 /);
  assert.deepEqual(await readFile(path.join(ctx.mediaRoot, KEY)), ctx.audio);
  assert.deepEqual(readEntryAudio(await ctx.entry()), {});
  assert.match((await ctx.pending()).reason, /pushes the media branch, waits for its deploy, verifies the public URL/);
  assert.equal(ctx.fake.stats.publicRequests.length, 0);
  assert.equal(ctx.fake.stats.putAttempts, 0);
});

test("drain attaches pending audio once it is live, and settle clears it after commit", async (t) => {
  const ctx = await setup(t, { extraEnv: { MEDIA_VERIFY_TIMEOUT_SEC: "1" } });
  assert.equal((await ctx.publish()).status, 0);
  git(ctx.sandbox.repo, "commit", "-q", "-m", "text only");
  ctx.fake.faults.public.set(KEY, { status: 404 });

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

  const requests = ctx.fake.stats.publicRequests.length;
  const again = await ctx.gate("drain");
  assert.equal(again.status, 0, again.stderr);
  assert.equal(ctx.fake.stats.publicRequests.length, requests, "an attach already staged is not verified twice");

  assert.equal((await ctx.gate("status")).status, 1, "record stays until the attach is committed");
  git(ctx.sandbox.repo, "commit", "-q", "-m", "attach");
  assert.equal((await ctx.gate("settle")).status, 0);
  assert.equal(await ctx.hasPending(), false);
  assert.equal((await ctx.gate("status")).status, 0);
});

test("a slow old record does not use up the drain budget of a newer one", async (t) => {
  const ctx = await setup(t);
  const OLD = "daily-2026-10-15";
  assert.equal((await ctx.publish({ slug: OLD })).status, 0);
  assert.equal((await ctx.publish()).status, 0);
  ctx.fake.faults.public.set(`digests/${OLD}.mp3`, { status: 404 });
  ctx.fake.faults.public.set(KEY, { notFoundTimes: 1 });

  const drained = await ctx.gate("drain", "--wait-sec", "3");
  assert.equal(drained.status, 1);
  assert.equal(readEntryAudio(await ctx.entry()).audioUrl, `/media/${KEY}`);
  assert.equal((await ctx.pending(OLD)).check, "status");
  assert.equal((await ctx.pending()).check, "verified");
  assert.equal((await ctx.gate("drain", "--wait-sec", "0")).status, 2);
});

test("drain refuses a record that points outside the media root or at another URL", async (t) => {
  const ctx = await setup(t);
  assert.equal((await ctx.publish()).status, 0);
  const record = await ctx.pending();
  const outside = path.join(ctx.sandbox.root, "outside.mp3");
  await writeFile(outside, ctx.audio);

  for (const forged of [{ file: outside }, { audioUrl: "/media/digests/elsewhere.mp3" }]) {
    await writeFile(ctx.pendingFile(), JSON.stringify({ ...record, ...forged }));
    const drained = await ctx.gate("drain");
    assert.equal(drained.status, 1);
    assert.match(drained.stderr, /still pending \(record:/);
    assert.equal(ctx.fake.stats.putAttempts, 0);
    assert.equal(ctx.fake.stats.publicRequests.length, 0);
    assert.deepEqual(readEntryAudio(await ctx.entry()), {});
    const status = await ctx.gate("status");
    assert.match(status.stderr, new RegExp(`fix: +${DROP.source} ${SLUG}$`, "m"));
  }
});

test("re-published audio that R2 already holds different bytes for is reported as a conflict, never retried", async (t) => {
  const ctx = await setup(t);
  assert.equal((await ctx.publish()).status, 0);
  assert.equal((await ctx.gate("drain")).status, 0);
  git(ctx.sandbox.repo, "commit", "-q", "-m", "first");
  assert.equal((await ctx.gate("settle")).status, 0);
  assert.equal((await ctx.publish({ bytes: randomBytes(2048), durationSec: 99 })).status, 0);

  const drained = await ctx.gate("drain");
  assert.equal(drained.status, 1);
  assert.equal((await ctx.pending()).check, "conflict");
  assert.equal(ctx.fake.stats.puts, 1);
  assert.deepEqual(ctx.fake.objects.get(KEY).body, ctx.audio);
  assert.deepEqual(readEntryAudio(await ctx.entry()), { audioUrl: `/media/${KEY}`, durationSec: 61 });

  const status = await ctx.gate("status");
  assert.equal(status.status, 1);
  assert.match(status.stderr, new RegExp(`^\\[audio\\] PENDING ${SLUG}: R2 already holds different audio under ${KEY}`, "m"));
  assert.match(status.stderr, /^ {2}reason: R2 object .* already exists with different content/m);
  assert.match(status.stderr, new RegExp(`published audio is unchanged: ${ctx.fake.publicBase}/${KEY} still serves the earlier upload`));
  assert.match(status.stderr, /^ {2}fix: +give the issue a new slug and publish it again$/m);
  assert.match(status.stderr, new RegExp(`or keep the published audio with ${DROP.source} ${SLUG}$`, "m"));
  assert.doesNotMatch(status.stderr, /retry:/);
});

test("re-publishing an issue keeps its committed player, and settle keeps the new audio queued", async (t) => {
  const ctx = await setup(t);
  assert.equal((await ctx.publish()).status, 0);
  assert.equal((await ctx.gate("drain")).status, 0);
  git(ctx.sandbox.repo, "commit", "-q", "-m", "first");
  assert.equal((await ctx.gate("settle")).status, 0);
  assert.equal(await ctx.hasPending(), false);

  const revised = await ctx.publish({ bytes: randomBytes(2048), durationSec: 99, body: "Body, revised." });
  assert.equal(revised.status, 0, revised.stderr);
  assert.equal(lastJson(revised.stdout).audioUrl, `/media/${KEY}`);
  assert.deepEqual(readEntryAudio(await ctx.entry()), { audioUrl: `/media/${KEY}`, durationSec: 61 });
  git(ctx.sandbox.repo, "commit", "-q", "-m", "revise text");
  assert.equal((await ctx.gate("settle")).status, 0);
  assert.equal((await ctx.pending()).check, "queued");
  assert.equal((await ctx.pending()).durationSec, 99);
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
  assert.equal(await exists(ctx.pendingFile("weekly-2026-10-16")), true);
  assert.equal(await exists(ctx.pendingFile("daily-general-2026-10-16")), false);

  const status = await ctx.gate("status");
  assert.equal(status.status, 1);
  assert.match(status.stderr, /PENDING weekly-2026-10-16/);
  assert.match(status.stderr, /url: {4}http:\/\/127\.0\.0\.1:\d+\/media\/digests\/weekly-2026-10-16\.mp3/);
  assert.match(status.stderr, /check: {2}content-type/);
  assert.match(status.stderr, /retry: {2}MEDIA_BACKEND=r2 DIGEST_PUSH=1 .*run\.sh attach-pending/);
});

test("verify-staged leaves entries alone when their audioUrl is already committed", async (t) => {
  const ctx = await setup(t);
  assert.equal((await ctx.publish()).status, 0);
  assert.equal((await ctx.gate("drain")).status, 0);
  git(ctx.sandbox.repo, "commit", "-q", "-m", "published");
  const file = path.join(ctx.sandbox.repo, ENTRY_REL);
  await writeFile(file, (await ctx.entry()).replace("Body.", "Body, edited."));
  git(ctx.sandbox.repo, "add", ENTRY_REL);
  const before = ctx.fake.stats.publicRequests.length;
  const result = await ctx.gate("verify-staged");
  assert.equal(result.status, 0, result.stderr);
  assert.equal(ctx.fake.stats.publicRequests.length, before);
});

test("a malformed pending record is skipped by drain and settle, and status names it until it is dropped", async (t) => {
  const ctx = await setup(t);
  assert.equal((await ctx.publish()).status, 0);
  git(ctx.sandbox.repo, "commit", "-q", "-m", "text only");
  const broken = ctx.pendingFile("weekly-2026-10-16");
  const misnamed = path.join(path.dirname(broken), "Not A Slug.json");
  await writeFile(broken, "{not json");
  await writeFile(misnamed, "{}");

  const drained = await ctx.gate("drain");
  assert.equal(drained.status, 0, drained.stderr);
  assert.ok(drained.stderr.includes(`skipping ${broken}: not valid JSON`), drained.stderr);
  assert.ok(drained.stderr.includes(`skipping ${misnamed}: the file name is not a digest slug`), drained.stderr);
  assert.equal(readEntryAudio(await ctx.entry()).audioUrl, `/media/${KEY}`);
  git(ctx.sandbox.repo, "commit", "-q", "-m", "attach");

  const settled = await ctx.gate("settle");
  assert.equal(settled.status, 0, settled.stderr);
  assert.ok(settled.stderr.includes(`skipping ${broken}`), settled.stderr);
  assert.equal(await ctx.hasPending(), false);

  const status = await ctx.gate("status");
  assert.equal(status.status, 1);
  assert.ok(status.stderr.includes(`UNREADABLE ${broken}`), status.stderr);
  assert.match(status.stderr, new RegExp(`fix: +${DROP.source} weekly-2026-10-16$`, "m"));
  assert.ok(status.stderr.includes(`fix:    rm -- ${misnamed}`), status.stderr);

  const dropped = await ctx.gate("drop", "--slug", "weekly-2026-10-16");
  assert.equal(dropped.status, 0, dropped.stderr);
  assert.match(dropped.stdout, /\{not json/);
  await rm(misnamed);
  assert.equal((await ctx.gate("status")).status, 0);
});

test("drop removes one pending record, prints it, and leaves the audio alone", async (t) => {
  const ctx = await setup(t);
  assert.equal((await ctx.publish()).status, 0);

  const dropped = await ctx.gate("drop", "--slug", SLUG);
  assert.equal(dropped.status, 0, dropped.stderr);
  assert.ok(dropped.stdout.includes(`dropped ${ctx.pendingFile()}`), dropped.stdout);
  assert.match(dropped.stdout, new RegExp(`"slug": "${SLUG}"`));
  assert.match(dropped.stdout, /audio file and any uploaded copy are untouched/);
  assert.equal(await ctx.hasPending(), false);
  assert.deepEqual(await readFile(path.join(ctx.sandbox.spool, KEY)), ctx.audio);
  assert.equal((await ctx.gate("status")).status, 0);

  const again = await ctx.gate("drop", "--slug", SLUG);
  assert.equal(again.status, 1);
  assert.match(again.stderr, new RegExp(`no pending audio record for ${SLUG}`));
  assert.equal((await ctx.gate("drop", "--slug", "../escape")).status, 2);
  assert.equal((await ctx.gate("drop")).status, 2);
});

test("status tells how to clear audio whose issue text was never published", async (t) => {
  const ctx = await setup(t);
  assert.equal((await ctx.publish()).status, 0);
  git(ctx.sandbox.repo, "rm", "-q", "-f", "--", ENTRY_REL);

  const drained = await ctx.gate("drain");
  assert.equal(drained.status, 1);
  assert.match(drained.stderr, /still pending \(entry:/);
  const status = await ctx.gate("status");
  assert.equal(status.status, 1);
  assert.match(status.stderr, /fix: +publish the issue text, then run MEDIA_BACKEND=r2 DIGEST_PUSH=1 \S+ attach-pending/);
  assert.match(status.stderr, new RegExp(`or stop waiting for this audio with ${DROP.source} ${SLUG}$`, "m"));
  assert.doesNotMatch(status.stderr, /retry:/);
});
