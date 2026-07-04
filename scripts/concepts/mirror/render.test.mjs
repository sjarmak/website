import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { buildEvidence } from "./evidence.mjs";
import { buildFixtureData } from "./fixture.mjs";
import { MANAGED_BY_TAG, noteFilename, renderNote, renderManagedRegion } from "./render.mjs";
import { REGION_BEGIN, REGION_END, contentHash, parseNote } from "./normalize.mjs";

const UPDATED = "2026-07-04T00:00:00.000Z";

// The golden managed region for the fixture's top concept — asserted exactly:
// thesis blockquote, themed sections, per-bullet evidence links (external
// markdown links + vault wikilink + paper takeaway), closing synthesis line.
const GOLDEN_MANAGED = [
  "> Synthetic definition of lorem ipsum, generated for fixture use only.",
  "",
  "## Digest coverage",
  "",
  "- [Fixture digest issue one](https://www.sjarmak.ai/digest/daily-0001)",
  "- [Fixture digest issue two](https://www.sjarmak.ai/digest/daily-0002)",
  "",
  "## Papers",
  "",
  "- [Synthetic Paper One](https://ui.adsabs.harvard.edu/abs/2099fixt.0001A/abstract) — Synthetic paper takeaway.",
  "",
  "## Explorer sections",
  "",
  "- [Fixture Explorer — lorem](https://www.sjarmak.ai/library/explorers/fixture-explorer#lorem)",
  "",
  "## Vault notes",
  "",
  "- [[Fixture Reference Note]]",
  "",
  "_Lorem Ipsum: 5 evidence items (2 digest coverage, 1 papers, 1 explorer sections, 1 vault notes)._",
].join("\n");

async function loremBundle(t) {
  const dir = await mkdtemp(path.join(os.tmpdir(), "concepts-render-"));
  t.after(() => rm(dir, { recursive: true, force: true }));
  const bundles = await buildEvidence(await buildFixtureData(dir));
  return bundles.find((b) => b.slug === "lorem-ipsum");
}

test("golden: managed region matches the synthetic fixture exactly", async (t) => {
  assert.equal(renderManagedRegion(await loremBundle(t)), GOLDEN_MANAGED);
});

test("golden: full note frontmatter keys, marker placement, hash binding", async (t) => {
  const note = renderNote(await loremBundle(t), { updated: UPDATED });

  // All generated content is confined between the markers; frontmatter is
  // the only thing above the begin marker in a fresh note.
  const parsed = parseNote(note);
  assert.equal(parsed.pre.trim(), "", "nothing but annotation space may exist outside the markers");
  assert.equal(parsed.post.trim(), "");
  assert.equal(parsed.managed, GOLDEN_MANAGED);
  assert.ok(note.trimEnd().endsWith(REGION_END));
  assert.equal(note.indexOf(REGION_BEGIN), note.lastIndexOf(REGION_BEGIN), "exactly one begin marker");

  assert.deepEqual(parsed.frontmatter, {
    title: "Lorem Ipsum",
    type: "concept",
    tags: ["concept", MANAGED_BY_TAG],
    "concept-id": "lorem-ipsum",
    updated: UPDATED,
    "content-hash": contentHash(GOLDEN_MANAGED),
  });
});

test("note filename derives from the label with path separators stripped", async (t) => {
  assert.equal(noteFilename(await loremBundle(t)), "Lorem Ipsum.md");
  assert.equal(noteFilename({ label: "A/B:C\\D" }), "A-B-C-D.md");
});
