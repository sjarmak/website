// User journeys:
// - A reader can enter the book once, then follow a stable ordered route.
// - Authored manuscript prose survives import unchanged apart from its duplicate H1.
// - Every manuscript image becomes a transparent, token-themed SVG with one accessible name.

import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, readdirSync, rmSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  BOOK,
  BOOK_SOURCE,
  CHAPTERS,
  importBook,
  transformManuscript,
} from "../scripts/content/import-agent-reliability-book.mjs";
import { bookChapterHref, prepareBookFigure } from "../src/lib/books.ts";

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

test("book manifest covers the approved 20 entries in a stable reading order", () => {
  assert.equal(BOOK.slug, "the-system-around-the-model");
  assert.equal(CHAPTERS.length, 20);
  assert.deepEqual(
    CHAPTERS.map((chapter) => chapter.order),
    Array.from({ length: 20 }, (_, index) => index),
  );
  assert.equal(CHAPTERS[0].kind, "introduction");
  assert.equal(CHAPTERS[0].slug, "introduction");
  assert.equal(CHAPTERS.at(-1).kind, "closing");
  assert.equal(CHAPTERS.at(-1).slug, "closing");
  assert.equal(new Set(CHAPTERS.map((chapter) => chapter.slug)).size, 20);
  assert.deepEqual(
    CHAPTERS.filter((chapter) => chapter.kind === "chapter").map((chapter) => chapter.number),
    Array.from({ length: 18 }, (_, index) => index + 1),
  );

  for (const chapter of CHAPTERS) {
    const source = path.join(BOOK_SOURCE, chapter.source);
    assert.ok(readFileSync(source, "utf8").startsWith("# "), `${chapter.source}: missing H1`);
  }
});

test("generated chapter bodies exactly match the approved source transformation", () => {
  for (const chapter of CHAPTERS) {
    const source = readFileSync(path.join(BOOK_SOURCE, chapter.source), "utf8");
    const transformed = transformManuscript(source, chapter.source);
    const generated = readFileSync(
      path.join(
        REPO_ROOT,
        "src/content/book-chapters",
        BOOK.slug,
        `${chapter.slug}.md`,
      ),
      "utf8",
    );
    const body = generated.replace(/^---\n[\s\S]*?\n---\n\n/, "");
    assert.equal(body, transformed.body, `${chapter.source}: generated body drifted`);
  }
});

test("importer writes exactly 20 Markdown entries and the 19 referenced SVGs", () => {
  const temp = mkdtempSync(path.join(os.tmpdir(), "website-book-import-"));
  const contentDir = path.join(temp, "chapters");
  const figureDir = path.join(temp, "figures");

  try {
    assert.deepEqual(importBook({ contentDir, figureDir }), {
      chapterCount: 20,
      figureCount: 19,
    });
    assert.equal(
      readdirSync(contentDir).filter((name) => name.endsWith(".md")).length,
      20,
    );
    assert.equal(
      readdirSync(figureDir).filter((name) => name.endsWith(".svg")).length,
      19,
    );
  } finally {
    rmSync(temp, { recursive: true, force: true });
  }
});

test("manuscript transform removes only the duplicate H1 and rewrites figure syntax", () => {
  const source = [
    "# Chapter 3: A title",
    "",
    "Opening sentence.",
    "",
    "![An accessible figure name.](./img/ch03-example.svg)",
    "",
    "The authored caption stays here.",
    "",
    "## Sources and evidence",
  ].join("\n");

  const result = transformManuscript(source, "ch03-example.md");

  assert.equal(result.title, "Chapter 3: A title");
  assert.equal(result.figureCount, 1);
  assert.equal(
    result.body,
    [
      "Opening sentence.",
      "",
      "![An accessible figure name.](/book-figures/ch03-example.svg)",
      "",
      "The authored caption stays here.",
      "",
      "## Sources and evidence",
    ].join("\n"),
  );
  assert.doesNotMatch(result.body, /<BookFigure/);
});

test("manuscript transform leaves non-figure prose and text fences byte-stable", () => {
  const source = [
    "# A title",
    "",
    "Before.",
    "",
    "```text",
    "dispatch -> commit -> record",
    "```",
    "",
    "After.",
    "",
  ].join("\n");

  const result = transformManuscript(source, "chapter.md");
  assert.equal(
    result.body,
    ["Before.", "", "```text", "dispatch -> commit -> record", "```", "", "After.", ""].join(
      "\n",
    ),
  );
  assert.equal(result.figureCount, 0);
});

test("manuscript transform renders authored LaTeX as semantic MathML", () => {
  const source = [
    "# A title",
    "",
    "For item \\(x_i\\), use:",
    "",
    "\\[",
    "\\bar d=\\frac{1}{n}\\sum_{i=1}^{n}d_i.",
    "\\]",
  ].join("\n");

  const result = transformManuscript(source, "math.md");
  assert.doesNotMatch(result.body, /\\\(|\\\)|\\\[|\\\]/);
  assert.match(result.body, /<math/);
  assert.match(result.body, /display="block"/);
  assert.match(result.body, /<annotation encoding="application\/x-tex">x_i<\/annotation>/);
  assert.match(result.body, /\\bar d=\\frac\{1\}\{n\}\\sum_\{i=1\}\^\{n\}d_i\./);
});

test("manuscript transform rejects malformed sources and non-SVG manuscript images", () => {
  assert.throws(() => transformManuscript("No heading", "bad.md"), /must begin with one H1/);
  assert.throws(
    () => transformManuscript("# Title\n\n![Alt](./img/chart.png)", "bad-image.md"),
    /unsupported manuscript image/,
  );
});

test("book figure preparation makes the canvas transparent and binds its palette to site tokens", () => {
  const raw = [
    '<svg viewBox="0 0 100 50" width="100" height="50" role="img" aria-labelledby="unique-title" class="bookfig">',
    '<title id="unique-title">One accessible name.</title>',
    '<style>.bookfig .f-bg{fill:#fff}.bookfig .f-ink{fill:#111}:where([data-theme="dark"]) .bookfig .f-bg{fill:#222}:where([data-theme="light"]) .bookfig .f-bg{fill:#fff}</style>',
    '<rect class="f-bg" width="100" height="50"/>',
    '<rect class="f-bg" x="10" y="10" width="20" height="10"/>',
    '<text class="f-ink" x="10" y="10">Label</text>',
    "</svg>",
  ].join("");

  const prepared = prepareBookFigure(raw, "example.svg");
  assert.match(prepared, /^<svg /);
  assert.doesNotMatch(prepared, /<svg[^>]*\swidth=/);
  assert.doesNotMatch(prepared, /<svg[^>]*\sheight=/);
  assert.match(prepared, /viewBox="0 0 100 50"/);
  assert.match(prepared, /aria-labelledby="unique-title"/);
  assert.match(prepared, /<title id="unique-title">One accessible name\.<\/title>/);
  assert.doesNotMatch(prepared, /<rect class="f-bg" width="100" height="50"\/>/);
  assert.match(prepared, /<rect class="f-bg" x="10" y="10" width="20" height="10"\/>/);
  assert.match(prepared, /\.bookfig \.f-bg\{fill:var\(--color-bg\)\}/);
  assert.match(prepared, /\.bookfig \.f-ink\{fill:var\(--color-text\)\}/);
  assert.doesNotMatch(prepared, /\[data-theme=/);
  assert.doesNotMatch(prepared, /fill:#(?:fff|111|222)/);
});

test("all 19 imported SVGs render with transparent canvases and the semantic palette", () => {
  const figureDir = path.join(
    REPO_ROOT,
    "src/assets/books/the-system-around-the-model",
  );
  const names = readdirSync(figureDir).filter((name) => name.endsWith(".svg"));
  assert.equal(names.length, 19);

  for (const name of names) {
    const raw = readFileSync(path.join(figureDir, name), "utf8");
    const prepared = prepareBookFigure(raw, name);
    const [, , width, height] = raw
      .match(/\bviewBox="([^"]+)"/)[1]
      .split(/\s+/);
    const canvas = new RegExp(
      `<rect class="f-bg"(?=[^>]*width="${width}")(?=[^>]*height="${height}")[^>]*/>`,
    );

    assert.doesNotMatch(prepared, canvas, `${name}: opaque outer canvas`);
    assert.match(prepared, /fill:var\(--color-bg\)/, `${name}: page background`);
    assert.match(prepared, /fill:var\(--color-text\)/, `${name}: primary ink`);
    assert.match(prepared, /fill:var\(--color-accent\)/, `${name}: accent`);
    assert.doesNotMatch(prepared, /\[data-theme=/, `${name}: embedded theme fork`);
  }
});

test("book figure preparation rejects a missing accessible title or theme override", () => {
  assert.throws(
    () => prepareBookFigure('<svg viewBox="0 0 1 1"></svg>', "untitled.svg"),
    /accessible title/,
  );
  assert.throws(
    () =>
      prepareBookFigure(
        '<svg viewBox="0 0 1 1" aria-labelledby="title"><title id="title">Title</title></svg>',
        "unthemed.svg",
      ),
    /explicit light and dark theme rules/,
  );
});

test("book figure preparation rejects executable SVG content before inlining", () => {
  const unsafe = [
    '<svg viewBox="0 0 1 1" role="img" aria-labelledby="title" class="bookfig">',
    '<title id="title">Unsafe</title>',
    '<style>[data-theme="dark"] .x{}[data-theme="light"] .x{}</style>',
    "<script>alert(1)</script>",
    "</svg>",
  ].join("");

  assert.throws(() => prepareBookFigure(unsafe, "unsafe.svg"), /unsafe executable content/);
});

test("chapter hrefs encode the approved stable route shape", () => {
  assert.equal(
    bookChapterHref("the-system-around-the-model", "variance-power-paired-comparisons"),
    "/books/the-system-around-the-model/variance-power-paired-comparisons",
  );
});
