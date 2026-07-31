// User journeys:
// - A reader can browse every taught and untaught practice beside its chapter.
// - Stable practice identifiers remain usable as direct-link anchors.
// - Updating the companion never requires rewriting in-progress chapter files.

import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import os from "node:os";
import path from "node:path";

import {
  COMPANION_SOURCE,
  analyzeCompanion,
  importCompanion,
  transformCompanion,
} from "../scripts/content/import-agent-reliability-companion.mjs";

const source = readFileSync(COMPANION_SOURCE, "utf8");

test("companion analysis verifies all 192 practices and their chapter split", () => {
  const analysis = analyzeCompanion(source);

  assert.equal(analysis.chapters.length, 18);
  assert.equal(analysis.practiceIds.length, 192);
  assert.equal(new Set(analysis.practiceIds).size, 192);
  assert.equal(analysis.taughtCount, 55);
  assert.equal(analysis.untaughtCount, 137);
  assert.deepEqual(
    analysis.chapters.map((chapter) => chapter.number),
    Array.from({ length: 18 }, (_, index) => index + 1),
  );
  assert.equal(
    analysis.chapters.reduce((sum, chapter) => sum + chapter.totalCount, 0),
    192,
  );
});

test("companion transform removes only its page H1 and renders authored math", () => {
  const transformed = transformCompanion(source);

  assert.equal(transformed.introTitle, "How to use this catalog");
  assert.ok(transformed.body.startsWith("This catalog indexes all 192 practices"));
  assert.doesNotMatch(transformed.body, /^# /m);
  assert.match(transformed.body, /<math/);
  assert.doesNotMatch(transformed.body, /\\\(|\\\)/);
});

test("companion importer writes one generated entry without touching chapter output", () => {
  const temp = mkdtempSync(path.join(os.tmpdir(), "book-companion-"));
  const outputPath = path.join(temp, "the-system-around-the-model.md");

  try {
    const result = importCompanion({ outputPath });
    const output = readFileSync(outputPath, "utf8");

    assert.deepEqual(result, {
      chapterCount: 18,
      practiceCount: 192,
      taughtCount: 55,
      untaughtCount: 137,
    });
    assert.match(output, /^---\ntitle: "Companion catalog"/);
    assert.match(output, /\nbook: the-system-around-the-model\n/);
    assert.match(output, /\npracticeCount: 192\n/);
    assert.match(output, /\nchapters:\n  - number: 1\n/);
    assert.match(output, /## Chapter 18:/);
  } finally {
    rmSync(temp, { recursive: true, force: true });
  }
});

test("companion analysis rejects duplicate practice ids and false chapter counts", () => {
  const duplicate = source.replace(
    "`power-analyze-before-running`",
    "`never-report-a-single-run`",
  );
  assert.throws(() => analyzeCompanion(duplicate), /duplicate practice id/);

  const falseCount = source.replace(
    "3 taught in the chapter, 10 carried here. 13 practices in total.",
    "3 taught in the chapter, 9 carried here. 12 practices in total.",
  );
  assert.throws(() => analyzeCompanion(falseCount), /Chapter 1 count mismatch/);
});
