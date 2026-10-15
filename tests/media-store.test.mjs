import assert from "node:assert/strict";
import { createHash, randomBytes } from "node:crypto";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";

import { r2ConfigFromEnv } from "../scripts/media/config.mjs";
import { ConflictError, createR2Client, createR2Store, putImmutable } from "../scripts/media/store.mjs";
import { startFakeMediaServer } from "./helpers/fake-media-server.mjs";

const sha = (buf) => createHash("sha256").update(buf).digest("hex");

async function setup(t) {
  const fake = await startFakeMediaServer();
  const dir = await mkdtemp(path.join(os.tmpdir(), "media-store-"));
  t.after(async () => {
    await fake.close();
    await rm(dir, { recursive: true, force: true });
  });
  const config = r2ConfigFromEnv({
    R2_ACCOUNT_ID: "0123456789abcdef0123456789abcdef",
    R2_ACCESS_KEY_ID: "test-access",
    R2_SECRET_ACCESS_KEY: "test-secret",
    R2_BUCKET: fake.bucket,
    R2_ENDPOINT_OVERRIDE: fake.endpoint,
  });
  const store = createR2Store(config, { client: createR2Client(config, { maxAttempts: 1 }) });
  const file = async (name, bytes = randomBytes(4096)) => {
    const p = path.join(dir, name);
    await writeFile(p, bytes);
    return { path: p, bytes };
  };
  return { fake, store, config, file };
}

test("a first upload writes an immutable object with type, cache policy and sha256 metadata", async (t) => {
  const { fake, store, file } = await setup(t);
  const audio = await file("a.mp3");
  const result = await putImmutable(store, { key: "digests/daily-2026-10-16.mp3", file: audio.path });
  assert.equal(result.status, "uploaded");
  assert.equal(result.sha256, sha(audio.bytes));
  assert.equal(result.bytes, audio.bytes.length);
  const obj = fake.objects.get("digests/daily-2026-10-16.mp3");
  assert.deepEqual(obj.body, audio.bytes);
  assert.equal(obj.contentType, "audio/mpeg");
  assert.equal(obj.cacheControl, "public, max-age=604800");
  assert.equal(obj.meta.sha256, sha(audio.bytes));
});

test("re-uploading identical bytes is a no-op (retries are idempotent)", async (t) => {
  const { fake, store, file } = await setup(t);
  const audio = await file("a.mp3");
  await putImmutable(store, { key: "digests/x.mp3", file: audio.path });
  const again = await putImmutable(store, { key: "digests/x.mp3", file: audio.path });
  assert.equal(again.status, "skipped");
  assert.equal(fake.stats.puts, 1);
  assert.equal(fake.stats.putAttempts, 1);
});

test("different bytes under an existing key raise ConflictError and leave the object untouched", async (t) => {
  const { fake, store, file } = await setup(t);
  const original = await file("a.mp3");
  const replacement = await file("b.mp3");
  await putImmutable(store, { key: "digests/x.mp3", file: original.path });
  await assert.rejects(
    putImmutable(store, { key: "digests/x.mp3", file: replacement.path }),
    (err) => err instanceof ConflictError && /immutable/.test(err.message),
  );
  assert.deepEqual(fake.objects.get("digests/x.mp3").body, original.bytes);
});

test("an existing object without sha256 metadata is never trusted or overwritten", async (t) => {
  const { fake, store, file } = await setup(t);
  const audio = await file("a.mp3");
  fake.putObject("digests/x.mp3", audio.bytes, "audio/mpeg", {});
  await assert.rejects(putImmutable(store, { key: "digests/x.mp3", file: audio.path }), ConflictError);
  assert.equal(fake.stats.putAttempts, 0);
});

test("two concurrent uploads of the same bytes both succeed with exactly one write", async (t) => {
  const { fake, store, file } = await setup(t);
  const audio = await file("a.mp3");
  let release;
  const bothArrived = new Promise((resolve) => (release = resolve));
  fake.faults.beforePutCommit = async () => {
    if (fake.stats.putAttempts === 2) release();
    await bothArrived;
  };
  const results = await Promise.all([
    putImmutable(store, { key: "digests/x.mp3", file: audio.path }),
    putImmutable(store, { key: "digests/x.mp3", file: audio.path }),
  ]);
  assert.deepEqual(results.map((r) => r.status).sort(), ["skipped", "uploaded"]);
  assert.equal(fake.stats.puts, 1);
  assert.equal(fake.stats.putAttempts, 2);
});

test("two concurrent uploads of different bytes: one wins, the other gets ConflictError", async (t) => {
  const { fake, store, file } = await setup(t);
  const a = await file("a.mp3");
  const b = await file("b.mp3");
  let release;
  const bothArrived = new Promise((resolve) => (release = resolve));
  fake.faults.beforePutCommit = async () => {
    if (fake.stats.putAttempts === 2) release();
    await bothArrived;
  };
  const results = await Promise.allSettled([
    putImmutable(store, { key: "digests/x.mp3", file: a.path }),
    putImmutable(store, { key: "digests/x.mp3", file: b.path }),
  ]);
  const fulfilled = results.filter((r) => r.status === "fulfilled");
  const rejected = results.filter((r) => r.status === "rejected");
  assert.equal(fulfilled.length, 1);
  assert.equal(rejected.length, 1);
  assert.ok(rejected[0].reason instanceof ConflictError);
  assert.equal(fake.stats.puts, 1);
});

test("an interrupted upload leaves no object and the rerun completes it", async (t) => {
  const { fake, store, file } = await setup(t);
  const audio = await file("a.mp3", randomBytes(256 * 1024));
  fake.faults.interruptPuts = 1;
  await assert.rejects(putImmutable(store, { key: "digests/x.mp3", file: audio.path }));
  assert.equal(fake.objects.has("digests/x.mp3"), false);
  const rerun = await putImmutable(store, { key: "digests/x.mp3", file: audio.path });
  assert.equal(rerun.status, "uploaded");
  assert.deepEqual(fake.objects.get("digests/x.mp3").body, audio.bytes);
});

test("the client signs with the explicit R2 keys and strips AWS profile variables first", async (t) => {
  const { config } = await setup(t);
  process.env.AWS_PROFILE = "omni-sso";
  process.env.AWS_ACCESS_KEY_ID = "employer-key";
  const client = createR2Client(config);
  assert.equal(process.env.AWS_PROFILE, undefined);
  assert.equal(process.env.AWS_ACCESS_KEY_ID, undefined);
  const creds = await client.config.credentials();
  assert.equal(creds.accessKeyId, "test-access");
  assert.equal(creds.secretAccessKey, "test-secret");
  assert.equal(await client.config.region(), "auto");
});
