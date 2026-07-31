import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";

import {
  digestAudioPath,
  requireMediaRoot,
} from "../scripts/digest/media-location.mjs";

test("digest media requires an explicit absolute media worktree root", () => {
  assert.throws(() => requireMediaRoot({}), /WEBSITE_MEDIA_ROOT/);
  assert.throws(
    () => requireMediaRoot({ WEBSITE_MEDIA_ROOT: "public/media" }),
    /absolute/,
  );
  assert.equal(
    requireMediaRoot({ WEBSITE_MEDIA_ROOT: "/srv/site-media/public/media" }),
    "/srv/site-media/public/media",
  );
});

test("digest audio paths stay inside the media worktree", () => {
  assert.equal(
    digestAudioPath(
      "daily-2026-07-30",
      { WEBSITE_MEDIA_ROOT: "/srv/site-media/public/media" },
    ),
    path.join(
      "/srv/site-media/public/media",
      "digests",
      "daily-2026-07-30.mp3",
    ),
  );
});

test("the cron runner commits media separately from main-site content", () => {
  const runner = readFileSync("scripts/digest/run.sh", "utf8");
  const publisher = readFileSync("scripts/digest/publish-digest.mjs", "utf8");
  const renderer = readFileSync("scripts/digest/tts-render.mjs", "utf8");

  assert.match(runner, /WEBSITE_MEDIA_DIR/);
  assert.match(runner, /git -C "\$WEBSITE_MEDIA_DIR"/);
  assert.doesNotMatch(runner, /git add src\/content\/digest public\/media/);
  assert.match(publisher, /digestAudioPath/);
  assert.match(renderer, /requireMediaRoot/);
  assert.doesNotMatch(publisher, /const AUDIO_DIR = "public\/media/);
  assert.doesNotMatch(renderer, /const OUT_DIR = "public\/media/);
});
