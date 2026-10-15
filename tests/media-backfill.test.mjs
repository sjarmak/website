import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";

import { parseTreeListing } from "../scripts/media/backfill.mjs";
import { git, runNode, TEST_ACCOUNT_ID } from "./helpers/digest-sandbox.mjs";
import { startFakeMediaServer } from "./helpers/fake-media-server.mjs";

const BLOB = "0123456789abcdef0123456789abcdef01234567";
const row = (mode, type, size, file) => `${mode} ${type} ${BLOB} ${String(size).padStart(7)}\t${file}`;

test("tree listings become media keys, skipping interrupted-write staging folders", () => {
  const listing = [
    row("100644", "blob", 120, "public/media/digests/daily-2026-10-15.mp3"),
    row("100644", "blob", 9, "public/media/.tmp-staging/daily-2026-10-15.mp3.123"),
    row("100644", "blob", 9, "public/media/digests/.tmp-old/partial.mp3"),
    row("100755", "blob", 64, "public/media/video/talk.mp4"),
    "",
  ].join("\0");
  assert.deepEqual(parseTreeListing(listing), [
    { key: "digests/daily-2026-10-15.mp3", blob: BLOB, bytes: 120 },
    { key: "video/talk.mp4", blob: BLOB, bytes: 64 },
  ]);
});

test("tree listings refuse entries that cannot be published as plain media objects", () => {
  assert.throws(() => parseTreeListing(row("120000", "blob", 9, "public/media/link.mp3")), /not a regular file/);
  assert.throws(() => parseTreeListing(row("160000", "commit", 0, "public/media/sub")), /not a regular file/);
  assert.throws(() => parseTreeListing(row("100644", "blob", 9, "public/media/notes.txt")), /no content type/);
  assert.throws(() => parseTreeListing(row("100644", "blob", 9, "src/content/x.mp3")), /outside public\/media/);
  assert.throws(() => parseTreeListing(row("100644", "blob", 9, "public/media/has space.mp3")), /invalid media key/);
});

async function mediaRepo(t) {
  const root = await mkdtemp(path.join(os.tmpdir(), "media-backfill-"));
  t.after(() => rm(root, { recursive: true, force: true }));
  const repo = path.join(root, "repo");
  const files = {
    "public/media/digests/daily-2026-10-14.mp3": randomBytes(3000),
    "public/media/digests/daily-2026-10-15.mp3": randomBytes(1500),
    "public/media/video/talk.mp4": randomBytes(800),
    "public/media/.tmp-staging/daily-2026-10-15.mp3.999": randomBytes(10),
  };
  for (const [file, body] of Object.entries(files)) {
    await mkdir(path.dirname(path.join(repo, file)), { recursive: true });
    await writeFile(path.join(repo, file), body);
  }
  git(root, "init", "-q", "-b", "media", repo);
  git(repo, "config", "user.email", "sandbox@example.invalid");
  git(repo, "config", "user.name", "Backfill Sandbox");
  git(repo, "add", "-A");
  git(repo, "commit", "-q", "-m", "media");
  git(repo, "checkout", "-q", "-b", "main");
  git(repo, "rm", "-q", "-r", "public");
  git(repo, "commit", "-q", "-m", "main carries no media");
  return { root, repo, files };
}

function backfillEnv(fake) {
  const env = { ...process.env };
  for (const name of Object.keys(env)) {
    if (/^(AWS_|R2_|MEDIA_)/.test(name)) delete env[name];
  }
  return {
    ...env,
    R2_ACCOUNT_ID: TEST_ACCOUNT_ID,
    R2_ACCESS_KEY_ID: "test-access",
    R2_SECRET_ACCESS_KEY: "test-secret",
    R2_BUCKET: fake.bucket,
    R2_ENDPOINT_OVERRIDE: fake.endpoint,
    MEDIA_VERIFY_TIMEOUT_SEC: "5",
  };
}

async function setup(t) {
  const fake = await startFakeMediaServer();
  t.after(() => fake.close());
  const media = await mediaRepo(t);
  const manifest = path.join(media.root, "manifest.json");
  const backfill = (...args) =>
    runNode("scripts/media/backfill.mjs", ["--ref", "media", "--manifest", manifest, ...args], {
      cwd: media.repo,
      env: backfillEnv(fake),
    }).done;
  const readManifest = async () => JSON.parse(await readFile(manifest, "utf8"));
  return { fake, ...media, manifest, backfill, readManifest };
}

test("backfill uploads every media object from the ref, and a rerun uploads nothing", async (t) => {
  const ctx = await setup(t);
  const first = await ctx.backfill();
  assert.equal(first.status, 0, first.stderr);
  assert.equal(ctx.fake.objects.size, 3);
  for (const [file, body] of Object.entries(ctx.files)) {
    const key = file.slice("public/media/".length);
    if (key.startsWith(".tmp-")) {
      assert.equal(ctx.fake.objects.has(key), false);
      continue;
    }
    assert.deepEqual(ctx.fake.objects.get(key).body, body);
  }
  assert.equal(ctx.fake.objects.get("video/talk.mp4").contentType, "video/mp4");
  assert.equal(ctx.fake.objects.get("digests/daily-2026-10-14.mp3").contentType, "audio/mpeg");
  const manifest = await ctx.readManifest();
  assert.equal(manifest.ref, "media");
  assert.equal(manifest.commit, git(ctx.repo, "rev-parse", "media"));
  assert.deepEqual(
    manifest.objects.map((o) => [o.key, o.status]),
    [
      ["digests/daily-2026-10-14.mp3", "uploaded"],
      ["digests/daily-2026-10-15.mp3", "uploaded"],
      ["video/talk.mp4", "uploaded"],
    ],
  );
  assert.ok(manifest.objects.every((o) => /^[a-f0-9]{64}$/.test(o.sha256)));

  const rerun = await ctx.backfill();
  assert.equal(rerun.status, 0, rerun.stderr);
  assert.equal(ctx.fake.stats.puts, 3);
  assert.deepEqual(
    (await ctx.readManifest()).objects.map((o) => o.status),
    ["skipped", "skipped", "skipped"],
  );
});

test("backfill --dry-run reports totals without touching the bucket", async (t) => {
  const ctx = await setup(t);
  const result = await ctx.backfill("--dry-run");
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /3 objects, 5300 bytes from media/);
  assert.match(result.stdout, /\.mp3: 2 objects, 4500 bytes/);
  assert.equal(ctx.fake.stats.heads, 0);
  assert.equal(ctx.fake.stats.putAttempts, 0);
});

test("backfill --key limits the run and --verify-base checks each public URL", async (t) => {
  const ctx = await setup(t);
  const result = await ctx.backfill("--key", "digests/daily-2026-10-15.mp3", "--verify-base", ctx.fake.publicBase);
  assert.equal(result.status, 0, result.stderr);
  assert.deepEqual([...ctx.fake.objects.keys()], ["digests/daily-2026-10-15.mp3"]);
  const [entry] = (await ctx.readManifest()).objects;
  assert.equal(entry.verifiedUrl, `${ctx.fake.publicBase}/digests/daily-2026-10-15.mp3`);
  assert.ok(ctx.fake.stats.publicRequests.some((r) => r.range === "bytes=0-1023"));
  const unknown = await ctx.backfill("--key", "digests/missing.mp3");
  assert.equal(unknown.status, 2);
  assert.match(unknown.stderr, /not on media: digests\/missing\.mp3/);
});

test("backfill records a conflicting object, keeps going, and exits 1", async (t) => {
  const ctx = await setup(t);
  ctx.fake.putObject("digests/daily-2026-10-14.mp3", Buffer.from("different bytes"), "audio/mpeg", {
    sha256: "f".repeat(64),
  });
  const result = await ctx.backfill();
  assert.equal(result.status, 1);
  const objects = (await ctx.readManifest()).objects;
  assert.equal(objects[0].status, "failed");
  assert.match(objects[0].error, /immutable/i);
  assert.deepEqual(objects.slice(1).map((o) => o.status), ["uploaded", "uploaded"]);
  assert.deepEqual(ctx.fake.objects.get("digests/daily-2026-10-14.mp3").body, Buffer.from("different bytes"));
});

test("backfill without credentials fails before uploading anything", async (t) => {
  const ctx = await setup(t);
  const result = await runNode("scripts/media/backfill.mjs", ["--ref", "media", "--manifest", ctx.manifest], {
    cwd: ctx.repo,
    env: { ...backfillEnv(ctx.fake), R2_ACCESS_KEY_ID: "" },
  }).done;
  assert.equal(result.status, 2);
  assert.match(result.stderr, /R2 credentials missing: R2_ACCESS_KEY_ID/);
  assert.equal(ctx.fake.stats.heads, 0);
});
