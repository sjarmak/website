import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  buildBookReferences,
  extractReferencesFromMarkdown,
  normalizeReferenceUrl,
} from "../src/lib/books/bookGraph.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SLUG = "engineering-reliable-coding-agents";

function frontmatter(source) {
  const block = source.match(/^---\n([\s\S]*?)\n---/)?.[1] ?? "";
  const value = (key) => block.match(new RegExp(`^${key}:\\s*(.+)$`, "m"))?.[1]?.replace(/^['\"]|['\"]$/g, "");
  return {
    title: value("title"),
    order: Number(value("order")),
    part: Number(value("part")),
    number: Number(value("number")),
    kind: value("kind"),
  };
}

function fixture() {
  const chapterDir = path.join(ROOT, "src/content/book-chapters", SLUG);
  const chapters = readdirSync(chapterDir)
    .filter((name) => name.endsWith(".md"))
    .map((name) => {
      const source = readFileSync(path.join(chapterDir, name), "utf8");
      return {
        id: name.replace(/\.md$/, ""),
        source,
        ...frontmatter(source),
      };
    });
  return {
    bookId: SLUG,
    chapters,
    companionSource: readFileSync(
      path.join(ROOT, "src/content/book-companions", `${SLUG}.md`),
      "utf8",
    ),
  };
}

test("normalizes equivalent scholarly destinations", () => {
  assert.equal(
    normalizeReferenceUrl("http://www.arxiv.org/pdf/2411.00640v2.pdf#page=3"),
    "https://arxiv.org/abs/2411.00640",
  );
  assert.equal(
    normalizeReferenceUrl("https://Example.com/report/?utm_source=test&x=1#notes"),
    "https://example.com/report?x=1",
  );
});

test("extracts linked, plain arXiv, DOI, and raw references without MathML noise", () => {
  const source = [
    "- Miller (2024), arXiv:2411.00640.",
    "- Duplicate [paper](https://arxiv.org/abs/2411.00640v3).",
    "- McNemar. DOI: 10.1007/BF02295996.",
    "- [Repository](https://github.com/sjarmak/codeprobe).",
    "- Raw source https://example.com/report/.",
    '<math xmlns="http://www.w3.org/1998/Math/MathML"></math>',
  ].join("\n");
  const references = extractReferencesFromMarkdown(source);
  assert.deepEqual(
    references.map((reference) => reference.url),
    [
      "https://arxiv.org/abs/2411.00640",
      "https://doi.org/10.1007/BF02295996",
      "https://github.com/sjarmak/codeprobe",
      "https://example.com/report",
    ],
  );
  assert.ok(references.every((reference) => !reference.citation.includes("](")));
});

test("builds the complete deduplicated book and companion reference index", () => {
  const index = buildBookReferences(fixture());
  assert.deepEqual(index.counts, {
    references: 368,
    citations: 440,
    papers: 331,
    articles: 21,
    repositories: 8,
    discussions: 8,
  });
  assert.equal(index.references.length, 368);
  assert.equal(new Set(index.references.map((reference) => reference.url)).size, 368);
  assert.equal(
    index.references.reduce((total, reference) => total + reference.citedBy.length, 0),
    440,
  );
  assert.ok(index.references.every((reference) => reference.url.startsWith("https://")));
});

test("links every citation back to its exact chapter or companion practice", () => {
  const index = buildBookReferences(fixture());
  const codeprobe = index.references.find(
    (reference) => reference.url === "https://github.com/sjarmak/codeprobe",
  );
  assert.ok(codeprobe);
  assert.equal(codeprobe.kind, "repository");
  assert.equal(codeprobe.citedBy.length, 9);
  assert.ok(
    codeprobe.citedBy.every((location) =>
      location.href.startsWith(`/books/${SLUG}/`) &&
      location.href.endsWith("#sources-and-evidence"),
    ),
  );

  const miller = index.references.find(
    (reference) => reference.url === "https://arxiv.org/abs/2411.00640",
  );
  assert.ok(miller);
  assert.match(miller.citation, /^Miller \(2024\)\. Adding Error Bars to Evals/);
  assert.ok(miller.citedBy.some((location) => location.sourceId === "chapter:1"));
  assert.ok(
    miller.citedBy.some(
      (location) =>
        location.sourceId === "practice:report-correlation-aware-standard-errors" &&
        location.href.endsWith("#report-correlation-aware-standard-errors"),
    ),
  );
  assert.ok(
    index.references.every(
      (reference) => new Set(reference.citedBy.map((location) => location.sourceId)).size === reference.citedBy.length,
    ),
  );
});

test("companion citations are attached only to the full untaught entries", () => {
  const index = buildBookReferences(fixture());
  const companionLocations = index.references.flatMap((reference) => reference.citedBy)
    .filter((location) => location.sourceKind === "practice");
  assert.equal(companionLocations.length, 209);
  assert.ok(companionLocations.every((location) => location.classification === "untaught"));
});
