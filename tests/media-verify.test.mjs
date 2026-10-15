import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";

import { VerifyError, verifyPublicMedia } from "../scripts/media/verify.mjs";
import { startFakeMediaServer } from "./helpers/fake-media-server.mjs";

const KEY = "digests/daily-2026-10-16.mp3";

async function setup(t, bytes = randomBytes(64 * 1024)) {
  const fake = await startFakeMediaServer();
  const dir = await mkdtemp(path.join(os.tmpdir(), "media-verify-"));
  t.after(async () => {
    await fake.close();
    await rm(dir, { recursive: true, force: true });
  });
  const file = path.join(dir, "a.mp3");
  await writeFile(file, bytes);
  fake.putObject(KEY, bytes, "audio/mpeg", {});
  const run = (overrides = {}) =>
    verifyPublicMedia({
      url: `${fake.publicBase}/${KEY}`,
      file,
      deadline: Date.now() + 400,
      minDelayMs: 10,
      maxDelayMs: 40,
      ...overrides,
    });
  return { fake, file, run };
}

const failsWith = (check) => (err) => {
  assert.ok(err instanceof VerifyError, err);
  assert.equal(err.check, check);
  assert.match(err.message, new RegExp(check));
  assert.ok(err.attempts >= 1);
  return true;
};

test("a correctly served object passes type, length, both edge ranges and the full hash", async (t) => {
  const { fake, run } = await setup(t);
  const result = await run();
  assert.equal(result.attempts, 1);
  const ranges = fake.stats.publicRequests.map((r) => r.range).filter(Boolean);
  assert.deepEqual(ranges, ["bytes=0-1023", `bytes=${64 * 1024 - 1024}-${64 * 1024 - 1}`]);
});

test("files smaller than one range window are checked end to end", async (t) => {
  const { run } = await setup(t, randomBytes(300));
  const result = await run();
  assert.equal(result.bytes, 300);
});

test("a wrong Content-Type fails the content-type check", async (t) => {
  const { fake, run } = await setup(t);
  fake.faults.public.set(KEY, { contentType: "application/octet-stream" });
  await assert.rejects(run(), failsWith("content-type"));
});

test("a short body fails the content-length check", async (t) => {
  const { fake, run } = await setup(t);
  fake.faults.public.set(KEY, { truncateBy: 7 });
  await assert.rejects(run(), failsWith("content-length"));
});

test("an origin that ignores Range fails the range check", async (t) => {
  const { fake, run } = await setup(t);
  fake.faults.public.set(KEY, { noRange: true });
  await assert.rejects(run(), failsWith("range-start"));
});

test("served bytes that differ from the local file fail the byte comparison", async (t) => {
  const { fake, run } = await setup(t);
  fake.faults.public.set(KEY, { corrupt: true });
  await assert.rejects(run(), failsWith("range-start"));
});

test("a persistent 404 fails the status check once the deadline passes", async (t) => {
  const { fake, run } = await setup(t);
  fake.faults.public.set(KEY, { status: 404 });
  await assert.rejects(run({ deadline: Date.now() + 150 }), (err) => {
    failsWith("status")(err);
    assert.ok(err.attempts > 1, "retried before giving up");
    return true;
  });
});

test("a URL that 404s while the CDN catches up passes once it starts serving", async (t) => {
  const { fake, run } = await setup(t);
  fake.faults.public.set(KEY, { notFoundTimes: 3 });
  const result = await run({ deadline: Date.now() + 5_000 });
  assert.equal(result.attempts, 4);
});

test("an expired deadline still makes exactly one attempt", async (t) => {
  const { fake, run } = await setup(t);
  fake.faults.public.set(KEY, { status: 404 });
  await assert.rejects(run({ deadline: Date.now() - 1 }), (err) => err.attempts === 1);
});
