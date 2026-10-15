import assert from "node:assert/strict";
import { mkdtemp, readdir, rm, stat, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";

import { localMediaPath, mediaFilesRoot, requireMediaRoot } from "../scripts/digest/media-location.mjs";
import { runNode } from "./helpers/digest-sandbox.mjs";
import { HAS_FFMPEG, fakeKokoroVenv } from "./helpers/fake-kokoro.mjs";

test("git backend media requires an explicit absolute media worktree root", () => {
  assert.throws(() => requireMediaRoot({}), /WEBSITE_MEDIA_ROOT/);
  assert.throws(() => requireMediaRoot({ WEBSITE_MEDIA_ROOT: "public/media" }), /absolute/);
  assert.equal(requireMediaRoot({ WEBSITE_MEDIA_ROOT: "/srv/site-media/public/media" }), "/srv/site-media/public/media");
});

test("local audio lives in the media worktree for git and in the spool for r2", () => {
  const git = { WEBSITE_MEDIA_ROOT: "/srv/site-media/public/media" };
  const r2 = { MEDIA_BACKEND: "r2", DIGEST_SPOOL: "/var/spool/media" };
  assert.equal(mediaFilesRoot(git), "/srv/site-media/public/media");
  assert.equal(mediaFilesRoot(r2), "/var/spool/media");
  assert.equal(localMediaPath("digests/daily-2026-07-30.mp3", git), "/srv/site-media/public/media/digests/daily-2026-07-30.mp3");
  assert.equal(localMediaPath("digests/daily-2026-07-30.mp3", r2), "/var/spool/media/digests/daily-2026-07-30.mp3");
  assert.throws(() => localMediaPath("../escape.mp3", r2), /invalid media key/);
  assert.throws(() => mediaFilesRoot({ MEDIA_BACKEND: "r2", DIGEST_SPOOL: "relative" }), /absolute/);
});

for (const backend of ["git", "r2"]) {
  test(`tts-render (${backend}) writes the finished MP3 atomically and prints its path`, { skip: !HAS_FFMPEG && "ffmpeg is not installed" }, async (t) => {
    const root = await mkdtemp(path.join(os.tmpdir(), "tts-render-"));
    t.after(() => rm(root, { recursive: true, force: true }));
    const transcript = path.join(root, "transcript.txt");
    await writeFile(transcript, "## SEGMENT: intro\n\nHello there. This is a **test** issue.\n\nSecond paragraph.\n");
    const mediaDir = backend === "git" ? path.join(root, "media", "public", "media") : path.join(root, "spool");
    const env = {
      ...process.env,
      KOKORO_VENV: await fakeKokoroVenv(root),
      MEDIA_BACKEND: backend,
      ...(backend === "git" ? { WEBSITE_MEDIA_ROOT: mediaDir } : { DIGEST_SPOOL: mediaDir }),
    };
    const result = await runNode(
      "scripts/digest/tts-render.mjs",
      ["--in", transcript, "--out", "daily-2026-10-16"],
      { cwd: root, env },
    ).done;
    assert.equal(result.status, 0, result.stderr);
    const printed = JSON.parse(result.stdout.trim());
    const expected = path.join(mediaDir, "digests", "daily-2026-10-16.mp3");
    assert.equal(printed.file, expected);
    assert.equal(printed.audioUrl, "/media/digests/daily-2026-10-16.mp3");
    assert.ok(Number.isInteger(printed.durationSec));
    assert.ok((await stat(expected)).size > 0);
    assert.deepEqual(await readdir(path.join(mediaDir, "digests")), ["daily-2026-10-16.mp3"]);
    assert.deepEqual(await readdir(path.join(mediaDir, ".tmp-staging")), []);
  });
}

test("tts-render refuses an --out that is not a digest slug", async (t) => {
  const root = await mkdtemp(path.join(os.tmpdir(), "tts-render-"));
  t.after(() => rm(root, { recursive: true, force: true }));
  const result = await runNode("scripts/digest/tts-render.mjs", ["--in", "x.txt", "--out", "Bad Slug"], {
    cwd: root,
    env: { ...process.env, MEDIA_BACKEND: "r2", DIGEST_SPOOL: root },
  }).done;
  assert.equal(result.status, 1);
  assert.match(result.stderr, /invalid digest slug/);
});
