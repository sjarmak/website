import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { test } from "node:test";
import YAML from "yaml";

import { attachEntryAudio, readEntryAudio, stripEntryAudio } from "../scripts/digest/entry-audio.mjs";

const DIGEST_DIR = "src/content/digest";

const entry = (frontmatter) => `---\n${frontmatter}\n---\n\nBody text.\n`;

test("stripping removes the player fields and keeps the body and other fields intact", () => {
  const md = entry("title: T\ndate: 2026-10-16\naudioUrl: /media/digests/x.mp3\ndurationSec: 900\nitems: []");
  const { md: stripped, removed } = stripEntryAudio(md);
  assert.equal(stripped, entry("title: T\ndate: 2026-10-16\nitems: []"));
  assert.deepEqual(removed, { audioUrl: "/media/digests/x.mp3", durationSec: 900 });
  assert.deepEqual(readEntryAudio(stripped), {});
});

test("durationSec stays when an embedUrl still renders a player", () => {
  const md = entry("title: T\naudioUrl: /media/digests/x.mp3\nembedUrl: https://youtu.be/x\ndurationSec: 900\nitems: []");
  const { md: stripped, removed } = stripEntryAudio(md);
  assert.equal(stripped, entry("title: T\nembedUrl: https://youtu.be/x\ndurationSec: 900\nitems: []"));
  assert.deepEqual(removed, { audioUrl: "/media/digests/x.mp3" });
});

test("attaching inserts audio in canonical position and is idempotent", () => {
  const md = entry("title: T\ntopics:\n  - evals\nitems: []\nhighlights: []");
  const once = attachEntryAudio(md, { audioUrl: "/media/digests/x.mp3", durationSec: 61 });
  assert.equal(
    once,
    entry("title: T\ntopics:\n  - evals\naudioUrl: /media/digests/x.mp3\ndurationSec: 61\nitems: []\nhighlights: []"),
  );
  assert.equal(attachEntryAudio(once, { audioUrl: "/media/digests/x.mp3", durationSec: 61 }), once);
  assert.deepEqual(readEntryAudio(once), { audioUrl: "/media/digests/x.mp3", durationSec: 61 });
});

test("an entry without frontmatter is rejected rather than rewritten", () => {
  assert.throws(() => stripEntryAudio("no frontmatter here\n"), /frontmatter/);
  assert.throws(() => attachEntryAudio("no frontmatter\n", { audioUrl: "/media/a.mp3" }), /frontmatter/);
});

const frontmatterOf = (md) => YAML.parse(/^---\n([\s\S]*?)\n---\n/.exec(md)[1]);
const bodyOf = (md) => md.slice(md.indexOf("\n---\n", 4));
const CANONICAL_AUDIO = /\naudioUrl: [^\n]+\n(durationSec: \d+\n)?(embedUrl: [^\n]+\n)?(durationSec: \d+\n)?items:/;
const countDurations = (text) => (text.match(/durationSec:/g) ?? []).length;

function inPublishOrder(md) {
  const block = CANONICAL_AUDIO.exec(md);
  return block !== null && countDurations(md) === countDurations(block[0]);
}

test("strip then attach round-trips every published digest entry", async () => {
  const names = (await readdir(DIGEST_DIR)).filter((n) => n.endsWith(".md"));
  let checked = 0;
  let byteIdentical = 0;
  for (const name of names) {
    const original = await readFile(path.join(DIGEST_DIR, name), "utf8");
    if (!readEntryAudio(original).audioUrl) continue;
    const { md, removed } = stripEntryAudio(original);
    const restored = attachEntryAudio(md, removed);
    assert.deepEqual(frontmatterOf(restored), frontmatterOf(original), name);
    assert.equal(bodyOf(restored), bodyOf(original), name);
    if (inPublishOrder(original)) {
      assert.equal(restored, original, name);
      byteIdentical += 1;
    }
    checked += 1;
  }
  assert.ok(checked > 100, `expected the archive to carry audio entries, checked ${checked}`);
  assert.ok(byteIdentical > 100, `expected most entries in publish-digest order, got ${byteIdentical}`);
});
