import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  buildBookGraph,
  parseCompanionPractices,
} from "../src/lib/books/bookGraph.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SLUG = "engineering-reliable-coding-agents";
const companionSource = readFileSync(
  path.join(ROOT, "src/content/book-companions", `${SLUG}.md`),
  "utf8",
);
const expectedCounts = Object.freeze({ total: 206, taught: 56, untaught: 150 });

function frontmatter(source) {
  const block = source.match(/^---\n([\s\S]*?)\n---/)?.[1] ?? "";
  const value = (key) => block.match(new RegExp(`^${key}:\\s*(.+)$`, "m"))?.[1]?.replace(/^['\"]|['\"]$/g, "");
  return {
    title: value("title"),
    book: value("book"),
    order: Number(value("order")),
    part: Number(value("part")),
    number: Number(value("number")),
    kind: value("kind"),
  };
}

function fixture() {
  const bookSource = readFileSync(path.join(ROOT, "src/content/books", `${SLUG}.md`), "utf8");
  const parts = [...bookSource.matchAll(/^  - number: (\d+)\n    title: (.+)$/gm)].map((match) => ({
    number: Number(match[1]),
    title: match[2].replace(/^['\"]|['\"]$/g, ""),
  }));
  const chapters = readdirSync(path.join(ROOT, "src/content/book-chapters", SLUG))
    .filter((name) => name.endsWith(".md"))
    .map((name) => {
      const data = frontmatter(readFileSync(path.join(ROOT, "src/content/book-chapters", SLUG, name), "utf8"));
      return { id: name.replace(/\.md$/, ""), ...data };
    });
  const book = frontmatter(bookSource);
  return {
    book: {
      id: SLUG,
      title: book.title,
      subtitle: "Evaluation, Recovery, Context, and Control Beyond the Model",
      description: "A reliability engineering book.",
      parts,
    },
    chapters,
    companionSource,
    expectedCounts,
  };
}

test("parses all companion practices with their explicit teaching class", () => {
  const practices = parseCompanionPractices(companionSource, expectedCounts);
  assert.equal(practices.length, 206);
  assert.equal(new Set(practices.map((practice) => practice.id)).size, 206);
  assert.equal(practices.filter((practice) => practice.classification === "taught").length, 56);
  assert.equal(practices.filter((practice) => practice.classification === "untaught").length, 150);
  assert.equal(practices[0].id, "never-report-a-single-run");
  assert.equal(practices[0].practiceId, "ERCA-020");
  assert.equal(practices[0].title, "Compare distributions across randomized repeated runs");
  assert.equal(practices[0].chapter, 1);
  assert.equal(practices[0].classification, "taught");
  assert.ok(practices.every((practice) => practice.summary.length > 20));
});

test("builds only the book's explicit structural relationships", () => {
  const graph = buildBookGraph(fixture());
  assert.deepEqual(graph.counts, {
    books: 1,
    parts: 6,
    chapters: 19,
    practices: 206,
    taught: 56,
    untaught: 150,
  });
  assert.equal(graph.nodes.length, 232);
  assert.equal(graph.edges.length, 231);
  assert.equal(new Set(graph.nodes.map((node) => node.id)).size, 232);
  assert.equal(new Set(graph.edges.map((edge) => edge.id)).size, 231);
  assert.equal(graph.edges.filter((edge) => edge.kind === "book-part").length, 6);
  assert.equal(graph.edges.filter((edge) => edge.kind === "part-chapter").length, 19);
  assert.equal(graph.edges.filter((edge) => edge.kind === "chapter-teaches").length, 56);
  assert.equal(graph.edges.filter((edge) => edge.kind === "chapter-carries").length, 150);
});

test("every chapter and practice node links to its canonical source", () => {
  const graph = buildBookGraph(fixture());
  const chapters = graph.nodes.filter((node) => node.kind === "chapter");
  const practices = graph.nodes.filter((node) => node.kind === "practice");
  assert.ok(chapters.every((node) => node.href.startsWith(`/books/${SLUG}/`)));
  assert.ok(practices.every((node) => node.href.startsWith(`/books/${SLUG}/companion#`)));
  assert.equal(
    graph.nodes.find((node) => node.id === "practice:never-report-a-single-run")?.href,
    `/books/${SLUG}/companion#never-report-a-single-run`,
  );
});

test("rejects malformed practice blocks and chapter-count drift", () => {
  assert.throws(
    () => parseCompanionPractices(
      companionSource.replace("`ERCA-020` · `never-report-a-single-run`", "missing-id"),
      expectedCounts,
    ),
    /stable identifier|practice count/i,
  );
  assert.throws(
    () => buildBookGraph({ ...fixture(), chapters: fixture().chapters.filter((chapter) => chapter.number !== 19) }),
    /chapter 19|19 chapters/i,
  );
});
