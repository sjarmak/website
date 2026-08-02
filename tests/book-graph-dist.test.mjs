import { before, test } from "node:test";
import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";

const execFileP = promisify(execFile);
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DIST = path.join(ROOT, "dist");
const SLUG = "engineering-reliable-coding-agents";

function page(...segments) {
  return readFileSync(path.join(DIST, ...segments, "index.html"), "utf8");
}

before(async () => {
  // Build only when the artifact is missing; an unconditional build here raced
  // the other dist suites' builds under node --test's parallel execution.
  if (!existsSync(path.join(DIST, "index.html"))) {
    await execFileP("npm", ["run", "build"], { cwd: ROOT, maxBuffer: 64 * 1024 * 1024 });
  }
});

test("the canonical explorer ships the complete graph and accessible controls", () => {
  const html = page("books", SLUG, "explore");
  assert.equal(html.split("<h1").length - 1, 1);
  assert.match(html, /data-book-graph-explorer/);
  assert.match(html, /data-book-graph-search/);
  assert.match(html, /data-practice-filter="taught"/);
  assert.match(html, /data-practice-filter="untaught"/);
  assert.match(html, /data-book-graph-detail/);
  assert.match(html, /data-book-graph-list/);

  const payload = html.match(/<script type="application\/json" data-book-graph-data>([\s\S]*?)<\/script>/)?.[1];
  assert.ok(payload, "graph JSON payload");
  const graph = JSON.parse(payload);
  assert.equal(graph.nodes.length, 217);
  assert.equal(graph.edges.length, 216);
  assert.deepEqual(graph.counts, {
    books: 1,
    parts: 6,
    chapters: 18,
    practices: 192,
    taught: 55,
    untaught: 137,
  });
});

test("the server-rendered list exposes every chapter and practice without JavaScript", () => {
  const html = page("books", SLUG, "explore");
  assert.equal((html.match(/data-book-graph-chapter/g) ?? []).length, 18);
  assert.equal((html.match(/data-book-graph-practice/g) ?? []).length, 192);
  const practices = html.split("data-book-graph-practice").slice(1, 193);
  assert.equal(practices.length, 192);
  practices.forEach((practice) => {
    assert.match(practice, new RegExp(`href="/books/${SLUG}/companion#`));
  });
});

test("book and companion pages link to the explorer", () => {
  const href = `/books/${SLUG}/explore`;
  assert.match(page("books", SLUG), new RegExp(`href="${href}"`));
  assert.match(page("books", SLUG, "companion"), new RegExp(`href="${href}"`));
});

test("legacy book URLs redirect to the matching canonical paths", () => {
  const oldRoot = page("books", "the-system-around-the-model");
  assert.match(oldRoot, new RegExp(`/books/${SLUG}`));
  assert.match(oldRoot, /http-equiv="refresh"/i);
  assert.match(oldRoot, /location\.hash/);

  const oldChapter = page("books", "the-system-around-the-model", "variance-power-paired-comparisons");
  assert.match(oldChapter, new RegExp(`/books/${SLUG}/variance-power-paired-comparisons`));
  assert.match(oldChapter, /location\.search \+ location\.hash/);
});

test("the sitemap publishes only the canonical book slug", () => {
  const sitemap = readFileSync(path.join(DIST, "sitemap-0.xml"), "utf8");
  assert.match(sitemap, new RegExp(`/books/${SLUG}/explore/`));
  assert.doesNotMatch(sitemap, /\/books\/the-system-around-the-model/);
});
